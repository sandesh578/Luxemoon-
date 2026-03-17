import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { OptimizedImage as Image } from '@/components/OptimizedImage';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import ProductPageClient from './ProductPageClient';
import { sanitizeAdminHtml } from '@/lib/sanitize-admin-html';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/currency';
import { getSiteConfig } from '@/lib/settings-server';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isArchived: false, isDraft: false },
      select: { slug: true },
    });

    return products.map((product) => ({ slug: product.slug }));
  } catch (error) {
    logger.warn('page.product.generateStaticParams.failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

const getProduct = unstable_cache(
  async (slug: string) => {
    const data = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { name: true } },
        reviews: {
          where: { approved: true, isHidden: false },
          orderBy: { createdAt: 'desc' as const },
          select: {
            id: true,
            userName: true,
            address: true,
            rating: true,
            comment: true,
            verifiedPurchase: true,
            images: true,
            video: true,
            isFeatured: true,
            isVerified: true,
            createdAt: true,
          },
        },
        transformations: {
          orderBy: { createdAt: 'desc' as const },
        }
      },
    });

    if (!data) return null;

    return {
        ...data,
        priceInside: Number(data.priceInside),
        priceOutside: Number(data.priceOutside),
        originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
        reviews: data.reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
        transformations: data.transformations.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })),
        category: data.category?.name || 'Uncategorized'
    };
  },
  ['product-detail'],
  { tags: ['products', 'reviews', 'transformations'], revalidate: 300 }
);

const getUnavailableSuggestions = unstable_cache(
  async () => {
    const products = await prisma.product.findMany({
      where: { isActive: true, isArchived: false, isDraft: false },
      select: { id: true, slug: true, name: true, priceInside: true, originalPrice: true, images: true },
      take: 4,
      orderBy: { orderItems: { _count: 'desc' } }
    });
    return products.map(p => ({
        ...p,
        priceInside: Number(p.priceInside),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    }));
  },
  ['unavailable-product-suggestions'],
  { tags: ['products'], revalidate: 300 }
);

const getRelatedProducts = unstable_cache(
  async (productId: string, categoryId: string | null) => {
    if (!categoryId) return [];

    const related = await prisma.product.findMany({
      where: { categoryId, isActive: true, isArchived: false, isDraft: false, NOT: { id: productId } },
      select: {
        id: true,
        slug: true,
        name: true,
        priceInside: true,
        originalPrice: true,
        images: true,
      },
      take: 2,
      orderBy: { stock: 'desc' }
    });

    return related.map(r => ({
        ...r,
        priceInside: Number(r.priceInside),
        originalPrice: r.originalPrice ? Number(r.originalPrice) : null,
    }));
  },
  ['related-products'],
  { tags: ['products'], revalidate: 300 }
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  const title = product.seoTitle || `${product.name} | Luxe Moon`;
  const description = product.seoDescription || product.description.slice(0, 160);
  const image = product.images[0] || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const startedAt = Date.now();
  const { slug } = await params;
  const [product, config] = await Promise.all([getProduct(slug), getSiteConfig()]);
  const currencyCode = config.currencyCode === 'NPR' ? 'NPR' : 'USD';
  const formatPrice = (amount: number) => formatCurrency(amount, currencyCode);

  if (!product) notFound();

  // Phase 5: Graceful No Longer Available view
  if (!product.isActive || product.isArchived || product.isDraft) {
    const suggestedProducts = await getUnavailableSuggestions();

    return (
      <div className="min-h-[80vh] bg-[#FDFCFB] flex flex-col items-center justify-center py-24 px-4 text-center">
        <h1 className="text-4xl font-serif font-bold text-stone-900 mb-4">Product No Longer Available</h1>
        <p className="text-stone-500 max-w-lg mb-12">The product you are looking for is currently unavailable or has been archived. Check out our featured products below.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto w-full text-left">
          {suggestedProducts.map(p => (
            <Link key={p.id} href={`/products/${p.slug}`} className="group cursor-pointer block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-stone-100 mb-4">
                {p.images[0] && (
                  <Image src={p.images[0]} fill className="object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                )}
              </div>
              <h3 className="font-serif text-lg text-stone-900 group-hover:text-amber-700 transition-colors">{p.name}</h3>
              <div className="flex items-center gap-3">
                <span className="font-bold text-stone-900">{formatPrice(p.priceInside)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const { createdAt, updatedAt, categoryId, category: catStr, transformations, ...rest } = product;
  const relatedProducts = await getRelatedProducts(product.id, categoryId);

  logger.info('page.product.rendered', {
    slug,
    durationMs: Date.now() - startedAt,
    reviewCount: product.reviews.length,
    transformationCount: transformations.length,
    relatedCount: relatedProducts.length,
  });

  return <ProductPageClient
    product={{
      ...rest,
      sanitizedMarketingDescription: rest.marketingDescription ? sanitizeAdminHtml(rest.marketingDescription) : null,
      category: catStr,
      faqs: (rest.faqs as any[] || []) as any,
      relatedProducts,
      transformations: transformations.map(t => ({
        ...t,
        createdAt: toIsoString(t.createdAt)
      })),
      reviews: product.reviews.map(r => ({
        ...r,
        createdAt: toIsoString(r.createdAt),
      })),
    }}
  />;
}
