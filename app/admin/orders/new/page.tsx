import { prisma } from '@/lib/prisma';
import ManualOrderForm from './ManualOrderForm';

export const dynamic = 'force-dynamic';

export default async function NewManualOrderPage() {
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            priceInside: true,
            priceOutside: true,
            stock: true,
            images: true,
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">Create Manual Order</h1>
            <ManualOrderForm products={products} />
        </div>
    );
}
