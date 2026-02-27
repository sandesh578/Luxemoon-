import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { sendOrderNotificationEmail } from '@/lib/notifications';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';
import { getSiteConfig, calculateDiscountedPrice } from '@/lib/settings';
import { NEPAL_PROVINCES, isValidProvinceDistrict } from '@/lib/nepal-data';

export const runtime = 'nodejs';

const OrderSchema = z.object({
  customerName: z.string().min(1).max(100),
  phone: z.string().regex(/^9\d{9}$/, 'Phone must be 10 digits starting with 9'),
  province: z.string().refine(val => val in NEPAL_PROVINCES, { message: 'Invalid province' }),
  district: z.string().min(1).max(100),
  address: z.string().min(1).max(500),
  landmark: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
  website: z.string().max(100).optional(),
  email: z.string().email().max(200).optional().or(z.literal('')),
  isInsideValley: z.boolean(),
  idempotencyKey: z.string().optional(),
  couponCode: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1).max(100)
  })).min(1)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

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

    // Honeypot check for bots
    if (data.website) {
      return NextResponse.json({ id: 'bot-' + Date.now() });
    }

    // Province/District validation
    if (!isValidProvinceDistrict(data.province, data.district)) {
      return NextResponse.json({ error: 'Invalid province/district combination' }, { status: 400 });
    }

    // Generate idempotency key if not provided
    const idempotencyKey = data.idempotencyKey || `${data.phone}_${Date.now()}`;

    // 2. Blacklist Check
    const blocked = await prisma.blockedCustomer.findUnique({
      where: { phone: data.phone }
    });

    if (blocked) {
      return NextResponse.json({ error: 'Order cannot be processed.' }, { status: 403 });
    }

    // 3. Idempotency Check
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey }
    });
    if (existingOrder) {
      return NextResponse.json(existingOrder);
    }

    // 4. Config Fetch for Delivery & Discount Calculation
    const config = await getSiteConfig();

    // 5. Transaction
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let subtotal = 0;
      const orderItemsData: Array<{ productId: string; quantity: number; price: number }> = [];
      const productSnapshots = new Map<
        string,
        {
          id: string;
          name: string;
          priceInside: number;
          priceOutside: number;
          discountPercent: number;
          discountFixed: number | null;
          discountStart: Date | null;
          discountEnd: Date | null;
          isBundle: boolean;
          bundleItemIds: string[];
        }
      >();

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            priceInside: true,
            priceOutside: true,
            discountPercent: true,
            discountFixed: true,
            discountStart: true,
            discountEnd: true,
            isBundle: true,
            bundleItemIds: true,
          },
        });
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        const basePrice = data.isInsideValley ? product.priceInside : product.priceOutside;

        // Apply product-level + global discount
        const unitPrice = calculateDiscountedPrice(basePrice, product, config);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: unitPrice
        });
        productSnapshots.set(item.productId, product);
      }

      // Process Coupon if provided
      let appliedCoupon: any = null;
      let couponDiscountAmount = 0;

      if (data.couponCode) {
        appliedCoupon = await tx.coupon.findUnique({
          where: { code: data.couponCode.toUpperCase() }
        });

        if (!appliedCoupon) throw new Error('Invalid coupon code');
        if (!appliedCoupon.isActive || appliedCoupon.deletedAt) throw new Error('Coupon is no longer active');

        const now = new Date();
        if (appliedCoupon.startsAt && now < appliedCoupon.startsAt) throw new Error('Coupon is not yet active');
        if (appliedCoupon.expiresAt && now > appliedCoupon.expiresAt) throw new Error('Coupon has expired');
        if (appliedCoupon.usageLimit !== null && appliedCoupon.usageCount >= appliedCoupon.usageLimit) throw new Error('Coupon usage limit reached');
        if (appliedCoupon.minOrderAmount !== null && subtotal < appliedCoupon.minOrderAmount) {
          throw new Error(`Minimum order amount of NPR ${appliedCoupon.minOrderAmount} required`);
        }

        if (!appliedCoupon.appliesToAll && appliedCoupon.productIds.length > 0) {
          const hasValidProduct = orderItemsData.some(item => appliedCoupon.productIds.includes(item.productId));
          if (!hasValidProduct) throw new Error('Coupon does not apply to items in cart');
        }

        if (appliedCoupon.discountType === 'FIXED') {
          couponDiscountAmount = appliedCoupon.discountValue;
        } else if (appliedCoupon.discountType === 'PERCENTAGE') {
          couponDiscountAmount = Math.floor(subtotal * (appliedCoupon.discountValue / 100));
        }

        if (appliedCoupon.maxDiscountCap && couponDiscountAmount > appliedCoupon.maxDiscountCap) {
          couponDiscountAmount = appliedCoupon.maxDiscountCap;
        }

        // Increment usage count
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usageCount: { increment: 1 } }
        });
      }

      // Calculate Delivery
      let deliveryCharge = 0;
      if (subtotal - couponDiscountAmount < config.freeDeliveryThreshold) {
        deliveryCharge = data.isInsideValley ? config.deliveryChargeInside : config.deliveryChargeOutside;
      }

      const codFee = config.codFee || 0;
      const finalTotal = subtotal - couponDiscountAmount + deliveryCharge + codFee;

      for (const item of orderItemsData) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });
        if (updated.count === 0) {
          const product = productSnapshots.get(item.productId);
          throw new Error(`Insufficient stock for: ${product?.name ?? item.productId}`);
        }
      }

      for (const item of orderItemsData) {
        const product = productSnapshots.get(item.productId);
        if (!product?.isBundle || product.bundleItemIds.length === 0) continue;

        for (const bundleItemId of product.bundleItemIds) {
          const bundleUpdated = await tx.product.updateMany({
            where: {
              id: bundleItemId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });
          if (bundleUpdated.count === 0) {
            throw new Error("Insufficient stock for bundled item");
          }
        }
      }

      return tx.order.create({
        data: {
          customerName: data.customerName,
          phone: data.phone,
          email: data.email || null,
          province: data.province,
          district: data.district,
          address: data.address,
          landmark: data.landmark,
          notes: data.notes,
          isInsideValley: data.isInsideValley,
          total: finalTotal,
          ipAddress: ip,
          idempotencyKey,
          couponId: appliedCoupon?.id || null,
          couponCode: appliedCoupon?.code || null,
          couponDiscount: couponDiscountAmount > 0 ? couponDiscountAmount : null,
          items: {
            create: orderItemsData
          }
        },
        include: { items: true }
      });
    });

    sendOrderNotificationEmail(order).catch((err: unknown) => logger.error('Async email error', err));

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
