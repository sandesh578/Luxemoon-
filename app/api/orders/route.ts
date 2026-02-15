import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendOrderNotificationEmail } from '@/lib/notifications';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';
import { getSiteConfig } from '@/lib/settings';

export const runtime = 'nodejs';

const OrderSchema = z.object({
  customerName: z.string().min(1),
  phone: z.string().min(10),
  province: z.string(),
  district: z.string(),
  address: z.string(),
  landmark: z.string().optional(),
  notes: z.string().optional(),
  isInsideValley: z.boolean(),
  idempotencyKey: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1)
  }))
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    
    // 1. Rate Limiting
    const recentOrders = await prisma.order.count({
      where: {
        ipAddress: ip,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }
      }
    });

    if (recentOrders >= 5) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const data = OrderSchema.parse(body);

    // 2. Blacklist Check
    const blocked = await prisma.blockedCustomer.findUnique({
      where: { phone: data.phone }
    });

    if (blocked) {
      return NextResponse.json({ error: 'Order cannot be processed.' }, { status: 403 });
    }

    // 3. Idempotency Check
    if (data.idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey: data.idempotencyKey }
      });
      if (existingOrder) {
        return NextResponse.json(existingOrder);
      }
    }

    // 4. Config Fetch for Delivery Calculation
    const config = await getSiteConfig();

    // 5. Transaction
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        if (product.stock < item.quantity) throw new Error(`Insufficient stock for: ${product.name}`);

        const unitPrice = data.isInsideValley ? product.priceInside : product.priceOutside;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: unitPrice
        });
      }

      // Calculate Delivery
      let deliveryCharge = 0;
      if (subtotal < config.freeDeliveryThreshold) {
        deliveryCharge = data.isInsideValley ? config.deliveryChargeInside : config.deliveryChargeOutside;
      }

      const finalTotal = subtotal + deliveryCharge;

      const newOrder = await tx.order.create({
        data: {
          customerName: data.customerName,
          phone: data.phone,
          province: data.province,
          district: data.district,
          address: data.address,
          landmark: data.landmark,
          notes: data.notes,
          isInsideValley: data.isInsideValley,
          total: finalTotal,
          ipAddress: ip,
          idempotencyKey: data.idempotencyKey,
          items: {
            create: orderItemsData
          }
        },
        include: { items: true }
      });

      for (const item of orderItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return newOrder;
    });

    sendOrderNotificationEmail(order).catch(err => logger.error('Async email error', err));

    return NextResponse.json(order);
  } catch (error) {
    logger.error('Order creation failed', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Order creation failed';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
