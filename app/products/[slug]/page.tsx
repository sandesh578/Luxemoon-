import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { OptimizedImage as Image } from '@/components/OptimizedImage';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import ProductPageClient from './ProductPageClient';

export const revalidate = 60;

const getProduct = cache(async (slug: string) => {
  return prisma.product.findUnique({
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
});

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
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  // Phase 5: Graceful No Longer Available view
  if (!product.isActive || product.isArchived || product.isDraft) {
    const suggestedProducts = await prisma.product.findMany({
      where: { isActive: true, isArchived: false, isDraft: false },
      select: { id: true, slug: true, name: true, priceInside: true, originalPrice: true, images: true },
      take: 4,
      orderBy: { orderItems: { _count: 'desc' } }
    });

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
                <span className="font-bold text-stone-900">NPR {p.priceInside.toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const { createdAt, updatedAt, categoryId, category: catRel, transformations, ...rest } = product;

  const relatedProducts = await prisma.product.findMany({
    where: { categoryId: categoryId, isActive: true, isArchived: false, isDraft: false, NOT: { id: product.id } },
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

  return <ProductPageClient
    product={{
      ...rest,
      category: catRel?.name || 'Uncategorized',
      faqs: (rest.faqs as any[] || []) as any,
      relatedProducts,
      transformations: transformations.map(t => ({
        ...t,
        createdAt: t.createdAt.toISOString()
      })),
      reviews: product.reviews.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    }}
  />;
}
