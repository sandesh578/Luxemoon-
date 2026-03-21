import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { decimalToNumber } from '@/lib/decimal';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const revalidate = 60;

const getCachedProducts = unstable_cache(
  async () =>
    prisma.product.findMany({
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
    }),
  ['api-products-list'],
  { revalidate: 60, tags: ['products'] }
);

export async function GET() {
  const startedAt = Date.now();
  try {
    const products = await getCachedProducts();
    const payload = products.map((product) => ({
      ...product,
      priceInside: decimalToNumber(product.priceInside),
      priceOutside: decimalToNumber(product.priceOutside),
    }));

    logger.info('api.products.success', { durationMs: Date.now() - startedAt, count: products.length });
    return NextResponse.json(payload);
  } catch (error) {
    logger.error('api.products.failed', error, { durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
