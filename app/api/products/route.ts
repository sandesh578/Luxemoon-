import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isArchived: false,
        isDraft: false,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        priceInside: true,
        priceOutside: true,
        images: true,
        isFeatured: true,
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
    logger.info('api.products.success', { durationMs: Date.now() - startedAt, count: products.length });
    return NextResponse.json(products);
  } catch (error) {
    logger.error('api.products.failed', error, { durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
