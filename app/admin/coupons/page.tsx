import { prisma } from '@/lib/prisma';
import AdminCouponsClient from './AdminCouponsClient';
import { verifyAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminCoupons() {
    await verifyAdmin();

    const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { orders: true }
            }
        }
    });

    const products = await prisma.product.findMany({
        where: { isDeleted: false, isActive: true },
        select: { id: true, name: true }
    });

    const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
    });

    return (
        <AdminCouponsClient
            coupons={coupons.map(c => ({
                ...c,
                startsAt: c.startsAt?.toISOString() || null,
                expiresAt: c.expiresAt?.toISOString() || null,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
            })) as any}
            products={products}
            categories={categories}
        />
    );
}
