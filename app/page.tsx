import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { prisma } from '@/lib/prisma';
import { ChevronRight, Star, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { translate } from '@/lib/i18n';
import { getLocaleServer } from '@/lib/i18n-server';
import { unstable_cache } from 'next/cache';
import { formatCurrency } from '@/lib/currency';
import { calculateDiscountedPrice } from '@/lib/settings';
import { getSiteConfig } from '@/lib/settings-server';
import { sanitizeAdminHtml } from '@/lib/sanitize-admin-html';

const HeroSlider = dynamic(() => import('@/components/HeroSlider').then((mod) => mod.HeroSlider));
const CommunitySlider = dynamic(() => import('@/components/CommunitySlider').then((mod) => mod.CommunitySlider));
const AnimateIn = dynamic(() => import('@/components/AnimateIn').then((mod) => mod.AnimateIn));
const StaggerContainer = dynamic(() => import('@/components/AnimateIn').then((mod) => mod.StaggerContainer));
const StaggerItem = dynamic(() => import('@/components/AnimateIn').then((mod) => mod.StaggerItem));
const QuickAddButton = dynamic(() => import('@/components/QuickAddButton').then((mod) => mod.QuickAddButton));

const getCachedHomepageData = unstable_cache(
  async () => {
    // getSiteConfig handles its own internal upsert/catch
    const config = await getSiteConfig();

    const [
      content,
      featuredProductsRaw,
      newArrivalsRaw,
      manualBestSellersRaw,
      nanoplastiaProductsRaw,
      allActiveProductsRaw,
    ] = await Promise.all([
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

    const sanitizeProducts = (products: any[]) => (products || []).filter(Boolean).map(p => {
        if (!p) return null;
        // Ensure priceInside and originalPrice are converted to numbers for JSON serialization
        const basePrice = p.priceInside ? Number(p.priceInside) : 0;
        const originalPrice = p.originalPrice ? Number(p.originalPrice) : null;
        
        return {
            ...p,
            priceInside: calculateDiscountedPrice(basePrice, p as any, config as any),
            originalPrice: originalPrice,
            // Next.js cache doesn't like complex objects like Decimals
            discountStart: p.discountStart?.toISOString() || null,
            discountEnd: p.discountEnd?.toISOString() || null,
        };
    }).filter(Boolean);

    const productById = new Map(allActiveProductsRaw.map((product) => [product.id, product]));
    const communityReviewsRaw = Array.isArray((content as any)?.communityReviews) ? (content as any).communityReviews : [];
    
    const fullCommunityReviews = communityReviewsRaw.map((r: any) => {
       if (!r.productId) return r;
       const p = productById.get(r.productId);
       if (!p) return null;
       const sanitizedList = sanitizeProducts([p]);
       if (sanitizedList.length === 0) return null;
       const sp = sanitizedList[0];
       return { 
         ...r, 
         product: { 
           ...sp, 
           image: sp.images?.[0] || 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=200' 
         } 
       };
    }).filter(Boolean);

    let bestSellersRaw = manualBestSellersRaw;
    if (manualBestSellersRaw.length < 4) {
      const takeAmount = 4 - manualBestSellersRaw.length;
      try {
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
          take: takeAmount,
          orderBy: { orderItems: { _count: 'desc' } },
        });
        bestSellersRaw = [...manualBestSellersRaw, ...topSellingRaw] as any[];
      } catch (e) {
        // Fallback if orderBy _count fails (e.g. relation issue)
        console.error("Top selling query failed, falling back to simple query", e);
        const fallbackRaw = await prisma.product.findMany({
          where: { 
            isActive: true, 
            isArchived: false, 
            isDraft: false,
            id: { notIn: manualBestSellersRaw.map(p => p.id) }
          },
          select: {
            id: true, slug: true, name: true, images: true, priceInside: true, originalPrice: true, discountPercent: true, discountFixed: true, discountStart: true, discountEnd: true
          },
          take: takeAmount,
          orderBy: { createdAt: 'desc' },
        });
        bestSellersRaw = [...manualBestSellersRaw, ...fallbackRaw] as any[];
      }
    }

    return [
        JSON.parse(JSON.stringify(content)), // Deep clone to handle any JSON serialization quirks
        sanitizeProducts(featuredProductsRaw),
        sanitizeProducts(newArrivalsRaw),
        sanitizeProducts(bestSellersRaw),
        sanitizeProducts(nanoplastiaProductsRaw),
        fullCommunityReviews
    ] as const;
  },
  ['home-page-data-v2'], // Bumped cache key
  { tags: ['products', 'homepage-content'], revalidate: 300 }
);

export default async function Home() {
  const locale = await getLocaleServer();
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  
  const config = await getSiteConfig();
  const homeData = await getCachedHomepageData();
  
  const [content, featuredProducts, newArrivals, bestSellers, nanoplastiaProducts, communityReviews] = homeData;
  const currencyCode = (config?.currencyCode as any) === 'NPR' ? 'NPR' : 'USD';
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
    <main className="min-h-screen bg-gradient-to-b from-[#FDFCFB] via-[#FBF7F2] to-[#F6EFE7]">
      {/* 1. Hero Section */}
      <HeroSlider slides={slides} />

      {/* 2. Best Sellers */}
      {bestSellers.length > 0 && (
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
      )}

      {/* 3. Trust Bar */}
      <div className="bg-stone-900 overflow-hidden py-3.5 md:py-4 border-y border-stone-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center md:justify-between items-center gap-6 md:gap-4">
          <TrustItem icon={<Star className="w-4 h-4 text-amber-500" />} text={t('home.trustPremiumFormula')} />
          <TrustItem icon={<ShieldCheck className="w-4 h-4 text-amber-500" />} text={t('home.trustDermTested')} />
          <TrustItem icon={<Zap className="w-4 h-4 text-amber-500" />} text={t('home.trustGlassFinish')} />
          <TrustItem icon={<ShieldCheck className="w-4 h-4 text-amber-500" />} text={t('home.trustAuthentic')} />
        </div>
      </div>

      {/* 4. Brand Philosophy / Heritage */}
      <AnimateIn>
        <section className="py-16 md:py-20 lg:py-24 px-4 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl -mr-48 -mt-48 opacity-40" />
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center rounded-3xl border border-stone-200/70 bg-white/80 p-6 md:p-10 shadow-sm">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={(((content?.promotionalImages as string[]) || [])[0]) || "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=1974&auto=format&fit=crop"}
                className="object-cover"
                alt="Brand Story"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-4">
                <span className="text-amber-600 font-semibold tracking-[0.2em] text-xs uppercase">{(content as any)?.heritageSubtitle || t('home.heritageLabel')}</span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-stone-900 leading-tight tracking-tight whitespace-pre-line">
                  {(content as any)?.heritageTitle || (
                    <>{t('home.heritageTitleLine1')} <br/><span className="italic text-amber-700">{t('home.heritageTitleLine2')}</span></>
                  )}
                </h2>
                <div className="section-divider" />
                {(content as any)?.heritageBody ? (
                  <div
                    className="prose prose-base md:prose-lg max-w-none text-stone-600 prose-headings:font-serif prose-headings:text-stone-900 prose-a:text-amber-600"
                    dangerouslySetInnerHTML={{ __html: sanitizeAdminHtml((content as any).heritageBody) }}
                  />
                ) : (
                  <p className="text-stone-600 leading-relaxed text-base md:text-lg whitespace-pre-line">
                    {t('home.heritageBody')}
                  </p>
                )}
              </div>
              <Link href="/about" className="group inline-flex items-center gap-2 font-bold text-stone-900 border-b-2 border-amber-600 pb-1 hover:text-amber-700 transition-colors text-sm">
                {t('home.readFullStory')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      </AnimateIn>

      {/* 5. Category Banners (Shampoo / Serum section) */}
      {nanoplastiaProducts && nanoplastiaProducts.length > 0 && (
        <section className="py-16 md:py-20 lg:py-24 px-4 bg-gradient-to-b from-stone-900 to-stone-800 border-y border-stone-700/70 text-[#F6EFE7]">
          <div className="max-w-7xl mx-auto space-y-12 md:space-y-16">
            <AnimateIn className="text-center space-y-4">
              <span className="text-amber-500 font-semibold tracking-[0.2em] text-xs uppercase">{t('home.nanoLabel')}</span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">{t('home.nanoTitle')}</h2>
              <p className="text-stone-400 max-w-lg mx-auto text-sm md:text-base">{t('home.nanoSubtitle')}</p>
              <div className="section-divider mx-auto !bg-amber-600" />
            </AnimateIn>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
              {orderedNanoplastiaProducts.map((p) => {
                const derivedDiscount = p.discountPercent && p.discountPercent > 0
                  ? p.discountPercent
                  : (p.originalPrice && p.originalPrice > p.priceInside)
                    ? Math.max(1, Math.round(((p.originalPrice - p.priceInside) / p.originalPrice) * 100))
                    : 0;

                return (
                  <StaggerItem key={p.id} className="group flex flex-col items-center text-center">
                    <Link href={`/products/${p.slug}`} className="w-full relative aspect-[4/5] rounded-2xl overflow-hidden bg-stone-800 mb-4 md:mb-6 shadow-2xl block card-premium border border-stone-700/60">
                      {p.images && p.images[0] && (
                        <Image
                          src={p.images[0]}
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        />
                      )}
                      {derivedDiscount > 0 && (
                        <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10">
                          {derivedDiscount}% OFF
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </Link>
                    <h3 className="font-serif text-lg md:text-xl text-white mb-2 group-hover:text-amber-500 transition-colors">{p.name}</h3>
                    <div className="flex items-center justify-center gap-3 mb-4 md:mb-6">
                      <span className="font-bold text-amber-500 text-base md:text-lg">{formatPrice(p.priceInside)}</span>
                      {p.originalPrice && p.originalPrice > p.priceInside && (
                        <span className="text-stone-500 line-through text-sm">{formatPrice(p.originalPrice)}</span>
                      )}
                    </div>
                    <div className="w-full max-w-xs transition-all duration-300 opacity-100 translate-y-0 lg:opacity-0 lg:-translate-y-4 pointer-events-auto lg:pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
                      <QuickAddButton product={p} className="w-full py-3 bg-amber-600 text-white text-sm font-bold rounded-full flex items-center justify-center gap-2 hover:bg-amber-500 hover:scale-105 transition-all duration-300 shadow-lg shadow-amber-900/20 active:scale-[0.98]" />
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
            <div className="text-center">
              <Link href="/shop" className="inline-flex items-center gap-2 font-bold text-amber-500 border-b-2 border-amber-600/30 pb-1 hover:text-amber-400 transition-colors uppercase tracking-wider text-sm">
                {t('home.shop3Step')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 6. Featured Products */}
      {featuredProducts.length > 0 && (
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
      )}

      {/* 7. New Arrivals */}
      {newArrivals.length > 0 && (
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
      )}

      {/* 8. Campaign Banners */}
      {(content?.banners as any[])?.filter((b: any) => b?.image)?.length > 0 && (
        <AnimateIn>
          <section className="py-16 md:py-20 px-4 bg-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {(content?.banners as any[])?.filter((b: any) => b?.image).map((banner: any, i: number) => (
                <Link key={i} href={banner.link || '#'} className="relative group overflow-hidden rounded-3xl aspect-[16/9] shadow-sm hover:shadow-lg transition-shadow duration-500 block bg-stone-100 border border-stone-200/70">
                  <Image
                    src={banner.image}
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    alt={banner.title || 'Campaign Banner'}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-500" />
                  <div className="absolute inset-0 flex items-center p-6 md:p-10">
                    <div className="max-w-xs space-y-3">
                      {banner.title && <h3 className="text-xl md:text-2xl font-semibold text-white leading-tight tracking-tight">{banner.title}</h3>}
                      {banner.link && (
                        <span className="inline-flex items-center gap-1 text-white text-xs font-bold border-b border-white pb-1 group-hover:gap-2 transition-all uppercase tracking-wider">
                          {t('home.exploreNow')} <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </AnimateIn>
      )}

      {/* 9. Loved by Community */}
      {communityReviews && communityReviews.length > 0 && (
        <section className="bg-[#FDFCFB]">
          <CommunitySlider reviews={communityReviews as any} currencyCode={currencyCode} />
        </section>
      )}



      {/* 10. Brand Values Grid */}
      <section className="py-16 md:py-20 lg:py-24 px-4 bg-stone-900 text-[#F6EFE7]">
        <StaggerContainer className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
          <StaggerItem className="space-y-4">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-600/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Zap className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight">{t('home.quickAbsorption')}</h3>
            <p className="text-stone-400 leading-relaxed text-sm md:text-base">{t('home.quickAbsorptionBody')}</p>
          </StaggerItem>
          <StaggerItem className="space-y-4">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-600/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <ShieldCheck className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight">{t('home.cleanIngredients')}</h3>
            <p className="text-stone-400 leading-relaxed text-sm md:text-base">{t('home.cleanIngredientsBody')}</p>
          </StaggerItem>
          <StaggerItem className="space-y-4">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-600/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Star className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight">{t('home.professionalCare')}</h3>
            <p className="text-stone-400 leading-relaxed text-sm md:text-base">{t('home.professionalCareBody')}</p>
          </StaggerItem>
        </StaggerContainer>
      </section>
    </main>
  );
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-stone-300">
      {icon}
      <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest">{text}</span>
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
  title: string;
  subtitle: string;
  products: any[];
  href: string;
  viewAllLabel: string;
  offerLabel: string;
  newLabel: string;
  currencyCode: 'USD' | 'NPR';
}) {
  return (
    <section className="py-16 md:py-20 lg:py-24 px-4 bg-[#FDFCFB]">
      <div className="max-w-7xl mx-auto space-y-10 md:space-y-14">
        <AnimateIn className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-stone-900 leading-tight tracking-tight">
              {title}
            </h2>
            <p className="text-stone-500 max-w-lg text-sm md:text-base">{subtitle}</p>
          </div>
          <Link
            href={href}
            className="group inline-flex items-center gap-2 font-bold text-stone-900 border-b-2 border-stone-200 pb-1 hover:border-amber-600 transition-all text-sm uppercase tracking-wider"
          >
            {viewAllLabel} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {products.map((p) => (
            <StaggerItem key={p.id}>
              <Link href={`/products/${p.slug}`} className="block group">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 mb-4 shadow-sm border border-stone-200/50">
                  {p.images && p.images[0] && (
                    <Image
                      src={p.images[0]}
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  )}
                  {p.originalPrice && p.originalPrice > p.priceInside && (
                    <span className="absolute top-3 left-3 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10">
                      {offerLabel}
                    </span>
                  )}
                  {p.isNew && (
                    <span className="absolute top-3 right-3 bg-stone-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10 uppercase tracking-widest">
                      {newLabel}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                </div>
                <div className="space-y-1.5 px-1">
                  <h3 className="text-sm font-bold text-stone-900 line-clamp-1 group-hover:text-amber-700 transition-colors uppercase tracking-tight">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-stone-900 text-sm">
                      {formatCurrency(p.priceInside, currencyCode)}
                    </span>
                    {p.originalPrice && p.originalPrice > p.priceInside && (
                      <span className="text-stone-400 line-through text-[11px] font-medium">
                        {formatCurrency(p.originalPrice, currencyCode)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
