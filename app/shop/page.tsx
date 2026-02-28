import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Sparkles, ChevronRight, Grid } from 'lucide-react';

import { SortDropdown } from './SortDropdown';
import { translate } from '@/lib/i18n';
import { getLocaleServer } from '@/lib/i18n-server';

export const revalidate = 60;

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const locale = await getLocaleServer();
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const { sort, filter } = await searchParams;
  const sortParam = typeof sort === 'string' ? sort : '';
  const filterParam = typeof filter === 'string' ? filter : '';

  let orderBy: any = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
  let where: any = { isActive: true, isArchived: false, isDraft: false };
  let pageTitle = t('shopPage.title');
  let pageSubtitle = t('shopPage.subtitle');

  if (sortParam === 'price_asc') orderBy = { priceInside: 'asc' };
  else if (sortParam === 'price_desc') orderBy = { priceInside: 'desc' };
  else if (sortParam === 'newest') orderBy = { createdAt: 'desc' };
  else if (sortParam === 'bestselling') orderBy = { orderItems: { _count: 'desc' } };

  if (filterParam === 'featured') {
    where.isFeatured = true;
    pageTitle = t('shopPage.featuredTitle');
    pageSubtitle = t('shopPage.featuredSubtitle');
  } else if (filterParam === 'new') {
    where.isNew = true;
    pageTitle = t('shopPage.newTitle');
    pageSubtitle = t('shopPage.newSubtitle');
  } else if (filterParam === 'bestsellers') {
    orderBy = { orderItems: { _count: 'desc' } };
    pageTitle = t('shopPage.bestTitle');
    pageSubtitle = t('shopPage.bestSubtitle');
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true, slug: true, name: true, images: true, priceInside: true, originalPrice: true, isFeatured: true, isNew: true, stock: true,
      },
      orderBy,
    }),
    prisma.category.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Shop Header */}
      <section className="bg-stone-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold">{pageTitle}</h1>
          <p className="text-stone-400 max-w-lg">{pageSubtitle}</p>
        </div>
      </section>

      {/* Category Quick Links */}
      <div className="bg-white border-b border-stone-100 sticky top-16 z-10 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 flex gap-8 py-4">
          <Link href="/shop" className="text-sm font-bold text-amber-600 whitespace-nowrap border-b-2 border-amber-600 pb-1">
            {t('shopPage.allProducts')}
          </Link>
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              prefetch={false}
              className="text-sm font-bold text-stone-400 hover:text-stone-900 transition-colors whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div className="flex items-center gap-2 text-stone-400">
            <Grid className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">{t('shopPage.showingItems', { count: products.length })}</span>
          </div>
          <SortDropdown />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {products.map(product => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              prefetch={false}
              className="group cursor-pointer block"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-stone-100 mb-4 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                {product.images[0] && (
                  <Image
                    src={product.images[0]}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={product.name}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    loading="lazy"
                  />
                )}

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isFeatured && (
                    <span className="text-[10px] font-bold bg-amber-500/90 text-white px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-lg">
                      <Star className="w-2 h-2 fill-current" /> {t('shopPage.bestseller').toUpperCase()}
                    </span>
                  )}
                  {product.originalPrice && product.originalPrice > product.priceInside && (
                    <span className="text-[10px] font-bold bg-red-600 text-white px-3 py-1 rounded-full shadow-lg">
                      {t('shopPage.offer').toUpperCase()}
                    </span>
                  )}
                </div>

                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="bg-stone-900 border border-stone-800 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full">{t('shopPage.soldOut')}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 px-2">
                <h3 className="font-serif text-lg text-stone-900 group-hover:text-amber-700 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-stone-900">{t('common.currency')} {product.priceInside.toLocaleString()}</span>
                  {product.originalPrice && product.originalPrice > product.priceInside && (
                    <span className="text-xs text-stone-400 line-through">{t('common.currency')} {product.originalPrice.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
