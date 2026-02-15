import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendOrderNotificationEmail } from '@/lib/notifications';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';

const OrderSchema = z.object({
  customerName: z.string().min(1),
  phone: z.string().min(10),
  province: z.string(),
  district: z.string(),
  address: z.string(),
  isInsideValley: z.boolean(),
  idempotencyKey: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    price: z.number()
  })),
  total: z.number()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    
    // 1. Rate Limiting (Simple DB Check)
    const recentOrders = await prisma.order.count({
      where: {
        ipAddress: ip,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) } // 1 minute
      }
    });

    if (recentOrders >= 5) {
      logger.warn('Rate limit exceeded for orders', { ip });
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const data = OrderSchema.parse(body);

    // 2. Blacklist Check
    const blocked = await prisma.blockedCustomer.findUnique({
      where: { phone: data.phone }
    });

    if (blocked) {
      logger.warn('Blocked customer attempted order', { phone: data.phone, ip });
      return NextResponse.json({ error: 'Order cannot be processed.' }, { status: 403 });
    }

    // 3. Idempotency Check
    if (data.idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey: data.idempotencyKey }
      });
      if (existingOrder) {
        logger.info('Idempotent order request', { idempotencyKey: data.idempotencyKey });
        return NextResponse.json(existingOrder);
      }
    }

    // 4. Transaction: Verify stock -> Create Order -> Decrement Stock
    const order = await prisma.$transaction(async (tx) => {
      // Verify Stock
      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product?.name || item.productId}`);
        }
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          customerName: data.customerName,
          phone: data.phone,
          province: data.province,
          district: data.district,
          address: data.address,
          isInsideValley: data.isInsideValley,
          total: data.total,
          ipAddress: ip,
          idempotencyKey: data.idempotencyKey,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: { items: true }
      });

      // Decrement Stock
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return newOrder;
    });

    logger.info('Order created successfully', { orderId: order.id, total: order.total });

    // Trigger Notifications Asynchronously
    sendOrderNotificationEmail(order).catch(err => logger.error('Async email error', err));

    return NextResponse.json(order);
  } catch (error) {
    logger.error('Order creation failed', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Order creation failed. Please check stock or try again.' }, { status: 400 });
  }
}