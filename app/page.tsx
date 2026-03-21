import Link from 'next/link';
import { OptimizedImage as Image } from '@/components/OptimizedImage';
import { prisma } from '@/lib/prisma';
import { HeroSlider } from '@/components/HeroSlider';
import { CommunitySlider } from '@/components/CommunitySlider';
import { ChevronRight, Star, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { QuickAddButton } from '@/components/QuickAddButton';
import { translate } from '@/lib/i18n';
import { getLocaleServer } from '@/lib/i18n-server';
import { unstable_cache } from 'next/cache';
import { formatCurrency } from '@/lib/currency';
import { calculateDiscountedPrice } from '@/lib/settings';
import { getSiteConfig } from '@/lib/settings-server';
import { sanitizeAdminHtml } from '@/lib/sanitize-admin-html';

const getCachedHomepageData = unstable_cache(
  async () => {
    const [
      config,
      content,
      featuredProductsRaw,
      newArrivalsRaw,
      manualBestSellersRaw,
      nanoplastiaProductsRaw,
      allActiveProductsRaw,
    ] = await Promise.all([
      getSiteConfig(),
      prisma.homepageContent.findUnique({ where: { id: 1 } }),
      prisma.product.findMany({
        where: { isActive: true, isArchived: false, isDraft: false, isFeatured: true },
        select: {
          id: true, slug: true, name: true, images: true, priceInside: true, originalPrice: true, isFeatured: true, discountPercent: true, discountFixed: true, discountStart: true, discountEnd: true
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        where: { isActive: true, isArchived: false, isDraft: false, isNew: true },
        select: {
          id: true, slug: true, name: true, images: true, priceInside: true, originalPrice: true, isNew: true, discountPercent: true, discountFixed: true, discountStart: true, discountEnd: true
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        // @ts-ignore – isBestSeller added via migration, not yet reflected in generated types
        where: { isActive: true, isArchived: false, isDraft: false, isBestSeller: true },
        select: {
          id: true, slug: true, name: true, images: true, priceInside: true, originalPrice: true, discountPercent: true, discountFixed: true, discountStart: true, discountEnd: true
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        where: {
          isActive: true,
          isArchived: false,
          isDraft: false,
          slug: {
            in: ['anti-hair-fall-shampoo', 'shining-silk-hair-mask', 'soft-silky-serum'],
          },
        },
        select: {
          id: true, slug: true, name: true, images: true, priceInside: true, originalPrice: true, isNew: true, stock: true, discountPercent: true, discountFixed: true, discountStart: true, discountEnd: true
        },
        take: 3,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.product.findMany({
        where: { isActive: true, isArchived: false, isDraft: false },
        select: {
          id: true, slug: true, name: true, images: true, priceInside: true, originalPrice: true, discountPercent: true, discountFixed: true, discountStart: true, discountEnd: true
        }
      }),
    ]);

    const sanitizeProducts = (products: any[]) => products.map(p => ({
        ...p,
        priceInside: calculateDiscountedPrice(Number(p.priceInside), p as any, config as any),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    }));

    const communityReviewsRaw = Array.isArray((content as any)?.communityReviews) ? (content as any).communityReviews : [];
    const fullCommunityReviews = communityReviewsRaw.map((r: any) => {
       if (!r.productId) return r;
       const p = allActiveProductsRaw.find(prod => prod.id === r.productId);
       if (!p) return r;
       const sp = sanitizeProducts([p])[0];
       return { ...r, product: { ...sp, image: sp.images?.[0] || 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=200' } };
    });

    let bestSellersRaw = manualBestSellersRaw;
    if (manualBestSellersRaw.length < 4) {
      const topSellingRaw = await prisma.product.findMany({
        where: { 
          isActive: true, 
          isArchived: false, 
          isDraft: false,
          id: { notIn: manualBestSellersRaw.map(p => p.id) }
        },
        select: {
          id: true, slug: true, name: true, images: true, priceInside: true, originalPrice: true, discountPercent: true, discountFixed: true, discountStart: true, discountEnd: true
        },
        take: 4 - manualBestSellersRaw.length,
        orderBy: { orderItems: { _count: 'desc' } },
      });
      bestSellersRaw = [...manualBestSellersRaw, ...topSellingRaw] as any[];
    }
    return [
        content,
        sanitizeProducts(featuredProductsRaw),
        sanitizeProducts(newArrivalsRaw),
        sanitizeProducts(bestSellersRaw),
        sanitizeProducts(nanoplastiaProductsRaw),
        fullCommunityReviews
    ] as const;
  },
  ['home-page-data'],
  { tags: ['products', 'homepage-content'], revalidate: 300 }
);

export default async function Home() {
  const locale = await getLocaleServer();
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const [homeData, config] = await Promise.all([getCachedHomepageData(), getSiteConfig()]);
  const [content, featuredProducts, newArrivals, bestSellers, nanoplastiaProducts, communityReviews] = homeData;
  const currencyCode = config.currencyCode === 'NPR' ? 'NPR' : 'USD';
  const formatPrice = (amount: number) => formatCurrency(amount, currencyCode);

  const nanoplastiaOrder = ['anti-hair-fall-shampoo', 'shining-silk-hair-mask', 'soft-silky-serum'];
  const orderedNanoplastiaProducts = [...nanoplastiaProducts].sort(
    (a, b) => nanoplastiaOrder.indexOf(a.slug) - nanoplastiaOrder.indexOf(b.slug)
  );

  const slides = (content?.heroSlides as any[]) || [
    {
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2574&auto=format&fit=crop",
      title: "Nano Botox 4-in-1",
      subtitle: "Shampoo + Hair Mask + Hair Serum. Build stronger, smoother, shinier hair in a complete 3-step routine.",
      link: "/shop",
      buttonText: "SHOP 3-STEP ROUTINE"
    }
  ];

  return (
    <main className="min-h-screen bg-[#FDFCFB]">
      {/* Hero Section */}
      <HeroSlider slides={slides} />

      {/* Trust Bar */}
      <div className="bg-stone-900 overflow-hidden py-6 border-y border-stone-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center md:justify-between items-center gap-8 md:gap-4">
          <TrustItem icon={<Star className="w-4 h-4 text-amber-500" />} text={t('home.trustPremiumFormula')} />
          <TrustItem icon={<ShieldCheck className="w-4 h-4 text-amber-500" />} text={t('home.trustDermTested')} />
          <TrustItem icon={<Zap className="w-4 h-4 text-amber-500" />} text={t('home.trustGlassFinish')} />
          <TrustItem icon={<ShieldCheck className="w-4 h-4 text-amber-500" />} text={t('home.trustAuthentic')} />
        </div>
      </div>

      {/* Community / Influencer Reviews */}
      {communityReviews && communityReviews.length > 0 && (
        <section className="bg-[#FDFCFB]">
          <CommunitySlider reviews={communityReviews as any} currencyCode={currencyCode} formatPrice={formatPrice} />
        </section>
      )}

      {/* Brand Philosophy */}
      <section className="py-24 px-4 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl -mr-48 -mt-48 opacity-50" />
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src={(((content?.promotionalImages as string[]) || [])[0]) || "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=1974&auto=format&fit=crop"}
              fill
              className="object-cover"
              alt="Brand Story"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
          </div>
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-amber-600 font-bold tracking-[0.2em] text-xs uppercase">{(content as any)?.heritageSubtitle || t('home.heritageLabel')}</span>
              <h2 className="text-4xl md:text-5xl font-serif text-stone-900 leading-tight whitespace-pre-line">
                {(content as any)?.heritageTitle || (
                  <>{t('home.heritageTitleLine1')} <br/><span className="italic text-amber-700">{t('home.heritageTitleLine2')}</span></>
                )}
              </h2>
              {(content as any)?.heritageBody ? (
                <div
                  className="prose prose-lg max-w-none text-stone-600 prose-headings:font-serif prose-headings:text-stone-900 prose-a:text-amber-600"
                  dangerouslySetInnerHTML={{ __html: sanitizeAdminHtml((content as any).heritageBody) }}
                />
              ) : (
                <p className="text-stone-600 leading-relaxed text-lg whitespace-pre-line">
                  {t('home.heritageBody')}
                </p>
              )}
            </div>
            <Link href="/about" className="group inline-flex items-center gap-2 font-bold text-stone-900 border-b-2 border-amber-600 pb-1 hover:text-amber-700 transition-colors">
              {t('home.readFullStory')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* NEW Nano Botox Section */}
      {nanoplastiaProducts && nanoplastiaProducts.length > 0 && (
        <section className="py-24 px-4 bg-stone-900 border-t border-stone-800 text-[#F6EFE7]">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <span className="text-amber-500 font-bold tracking-[0.2em] text-xs uppercase animate-pulse">{t('home.nanoLabel')}</span>
              <h2 className="text-4xl md:text-5xl font-serif">{t('home.nanoTitle')}</h2>
              <p className="text-stone-400 max-w-lg mx-auto">{t('home.nanoSubtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {orderedNanoplastiaProducts.map((p) => {
                const derivedDiscount = p.discountPercent && p.discountPercent > 0
                  ? p.discountPercent
                  : (p.originalPrice && p.originalPrice > p.priceInside)
                    ? Math.max(1, Math.round(((p.originalPrice - p.priceInside) / p.originalPrice) * 100))
                    : 0;

                return (
                  <div key={p.id} className="group flex flex-col items-center text-center">
                    <Link href={`/products/${p.slug}`} className="w-full relative aspect-[4/5] rounded-3xl overflow-hidden bg-stone-800 mb-6 shadow-2xl block hover:-translate-y-2 transition-transform duration-500">
                      {p.images && p.images[0] && (
                        <Image
                          src={p.images[0] || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}
                          fill
                          className="object-cover group-hover:scale-110 group-hover:opacity-80 transition-all duration-700"
                          alt={p.name}
                          sizes="(max-width: 768px) 100vw, 33vw"
                          loading="lazy"
                        />
                      )}
                      {derivedDiscount > 0 && (
                        <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10">
                          {derivedDiscount}% OFF
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </Link>
                    <h3 className="font-serif text-2xl text-white mb-2 group-hover:text-amber-500 transition-colors">{p.name}</h3>
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <span className="font-bold text-amber-500 text-lg">{formatPrice(p.priceInside)}</span>
                      {p.originalPrice && p.originalPrice > p.priceInside && (
                        <span className="text-stone-500 line-through text-sm">{formatPrice(p.originalPrice)}</span>
                      )}
                    </div>
                    <div className="w-full max-w-xs transition-all duration-300 opacity-100 translate-y-0 lg:opacity-0 lg:-translate-y-4 pointer-events-auto lg:pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
                      <QuickAddButton product={p} className="w-full py-3 bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20 active:scale-[0.98]" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <Link href="/shop" className="inline-flex items-center gap-2 font-bold text-amber-500 border-b-2 border-amber-600/30 pb-1 hover:text-amber-400 transition-colors uppercase tracking-wider text-sm">
                {t('home.shop3Step')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Product Sections */}
      <ProductGrid
        title={t('home.featuredTitle')}
        subtitle={t('home.featuredSubtitle')}
        products={featuredProducts}
        href="/shop?filter=featured"
        viewAllLabel={t('home.viewAll')}
        offerLabel={t('home.offer')}
        newLabel={t('home.newBadge')}
        currencyCode={currencyCode}
      />
      <ProductGrid
        title={t('home.newTitle')}
        subtitle={t('home.newSubtitle')}
        products={newArrivals}
        href="/shop?filter=new"
        viewAllLabel={t('home.viewAll')}
        offerLabel={t('home.offer')}
        newLabel={t('home.newBadge')}
        currencyCode={currencyCode}
      />
      <ProductGrid
        title={t('home.bestTitle')}
        subtitle={t('home.bestSubtitle')}
        products={bestSellers}
        href="/shop?filter=bestsellers"
        viewAllLabel={t('home.viewAll')}
        offerLabel={t('home.offer')}
        newLabel={t('home.newBadge')}
        currencyCode={currencyCode}
      />

      {/* Campaign Banners */}
      {(content?.banners as any[])?.filter((b: any) => b?.image)?.length > 0 && (
        <section className="py-12 px-4 bg-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {(content?.banners as any[])?.filter((b: any) => b?.image).map((banner: any, i: number) => (
              <Link key={i} href={banner.link || '#'} className="relative group overflow-hidden rounded-3xl aspect-[16/9] shadow-lg block bg-stone-100">
                <Image
                  src={banner.image}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  alt={banner.title || 'Campaign Banner'}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex items-center p-8 md:p-12">
                  <div className="max-w-xs space-y-4">
                    {banner.title && <h3 className="text-2xl md:text-3xl font-serif text-white leading-tight">{banner.title}</h3>}
                    {banner.link && (
                      <span className="inline-flex items-center gap-1 text-white text-sm font-bold border-b border-white pb-1 group-hover:gap-2 transition-all">
                        {t('home.exploreNow')} <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Brand Values Grid */}
      <section className="py-24 px-4 bg-stone-900 text-[#F6EFE7]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-amber-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-serif">{t('home.quickAbsorption')}</h3>
            <p className="text-stone-400 leading-relaxed">{t('home.quickAbsorptionBody')}</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-amber-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-serif">{t('home.cleanIngredients')}</h3>
            <p className="text-stone-400 leading-relaxed">{t('home.cleanIngredientsBody')}</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-amber-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-serif">{t('home.professionalCare')}</h3>
            <p className="text-stone-400 leading-relaxed">{t('home.professionalCareBody')}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-stone-300">
      {icon}
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{text}</span>
    </div>
  );
}

function ProductGrid({
  title,
  subtitle,
  products,
  href,
  viewAllLabel,
  offerLabel,
  newLabel,
  currencyCode,
}: {
  title: string,
  subtitle: string,
  products: any[],
  href: string,
  viewAllLabel: string,
  offerLabel: string,
  newLabel: string,
  currencyCode: 'USD' | 'NPR',
}) {
  if (!products || products.length === 0) return null;
  const formatPrice = (amount: number) => formatCurrency(amount, currencyCode);
  return (
    <section className="py-24 px-4 bg-[#FDFCFB] border-t border-stone-100">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-3">
            <h2 className="text-4xl font-serif text-stone-900">{title}</h2>
            <p className="text-stone-500 max-w-lg">{subtitle}</p>
          </div>
          <Link href={href} className="text-stone-900 font-bold hover:text-amber-600 transition-colors flex items-center gap-2">
            {viewAllLabel} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((p) => {
            const derivedDiscount = p.discountPercent && p.discountPercent > 0
              ? p.discountPercent
              : (p.originalPrice && p.originalPrice > p.priceInside)
                ? Math.max(1, Math.round(((p.originalPrice - p.priceInside) / p.originalPrice) * 100))
                : 0;

            return (
              <div key={p.id} className="group cursor-pointer">
                <Link href={`/products/${p.slug}`}>
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-stone-100 mb-4 relative shadow-sm">
                    {p.images && p.images[0] && (
                      <Image
                        src={p.images[0] || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={p.name}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        loading="lazy"
                      />
                    )}
                    {derivedDiscount > 0 && (
                      <span className="absolute top-4 left-4 bg-amber-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                        {derivedDiscount}% OFF
                      </span>
                    )}
                    {p.isNew && (
                      <span className="absolute top-4 right-4 bg-stone-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                        {newLabel.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-xl text-stone-900 mb-1 group-hover:text-amber-700 transition-colors">{p.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-stone-900">{formatPrice(p.priceInside)}</span>
                    {p.originalPrice && p.originalPrice > p.priceInside && (
                      <span className="text-stone-400 line-through text-xs">{formatPrice(p.originalPrice)}</span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
