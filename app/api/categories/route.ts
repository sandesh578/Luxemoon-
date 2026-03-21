import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth';

export const revalidate = 300;

const getCachedCategories = unstable_cache(
    async () =>
        prisma.category.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' },
        }),
    ['api-categories-list'],
    { revalidate: 300, tags: ['categories'] }
);

export async function GET() {
    try {
        const categories = await getCachedCategories();
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await verifyAdmin();

        const body = await req.json();
        const { name, slug, image, description } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: { name, slug, image, description },
        });

        return NextResponse.json(category);
    } catch (error) {
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
