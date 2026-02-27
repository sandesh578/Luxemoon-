import { prisma } from '@/lib/prisma';
import AdminTransformationsClient from './AdminTransformationsClient';
import { verifyAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminTransformations() {
    await verifyAdmin();

    const transformations = await prisma.transformation.findMany({
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true } } }
    });

    const products = await prisma.product.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    return (
        <AdminTransformationsClient
            transformations={transformations.map(t => ({
                ...t,
                createdAt: t.createdAt.toISOString()
            })) as any}
            products={products}
        />
    );
}
