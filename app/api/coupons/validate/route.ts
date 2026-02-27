import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const ValidateCouponSchema = z.object({
    code: z.string().min(1).max(50),
    subtotal: z.number().nonnegative(),
    itemIds: z.array(z.string()),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = ValidateCouponSchema.parse(body);

        const coupon = await prisma.coupon.findUnique({
            where: { code: data.code.toUpperCase() }
        });

        if (!coupon) {
            return NextResponse.json({ error: 'Invalid coupon code.' }, { status: 404 });
        }

        if (!coupon.isActive || coupon.deletedAt) {
            return NextResponse.json({ error: 'This coupon is no longer active.' }, { status: 400 });
        }

        const now = new Date();
        if (coupon.startsAt && now < coupon.startsAt) {
            return NextResponse.json({ error: 'This coupon is not yet active.' }, { status: 400 });
        }
        if (coupon.expiresAt && now > coupon.expiresAt) {
            return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 });
        }

        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
            return NextResponse.json({ error: 'This coupon usage limit has been reached.' }, { status: 400 });
        }

        if (coupon.minOrderAmount !== null && data.subtotal < coupon.minOrderAmount) {
            return NextResponse.json({ error: `Minimum order amount of NPR ${coupon.minOrderAmount.toLocaleString()} required.` }, { status: 400 });
        }

        // Product/Category Restrictions (Server-side validation check)
        if (!coupon.appliesToAll && coupon.productIds.length > 0) {
            const hasValidProduct = data.itemIds.some(id => coupon.productIds.includes(id));
            if (!hasValidProduct) {
                return NextResponse.json({ error: 'This coupon does not apply to the items in your cart.' }, { status: 400 });
            }
        }

        return NextResponse.json(coupon);

    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: err.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
    }
}
