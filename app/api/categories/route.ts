import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth';

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' },
        });
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
    } catch {
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
