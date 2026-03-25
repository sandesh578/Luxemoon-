'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
const QuickAddButton = dynamic(() => import('@/components/QuickAddButton').then(mod => mod.QuickAddButton), { ssr: false });
import { formatCurrency } from '@/lib/currency';
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';

export interface CommunityReview {
  mediaUrl: string;
  mediaType: 'video' | 'image';
  productId: string;
  product?: {
    id: string;
    slug: string;
    name: string;
    priceInside: number;
    originalPrice?: number | null;
    image: string;
  };
}

function CommunityVideoCard({ 
  review, 
  isActive, 
  currencyCode 
}: { 
  review: CommunityReview, 
  isActive: boolean,
  currencyCode: 'USD' | 'NPR'
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Robust play/pause logic
  useEffect(() => {
    if (!videoRef.current) return;
    
    const shouldPlay = (isActive || isHovered) && !isPaused;
    
    if (shouldPlay) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented, we handle this by remaining paused
          console.log("Playback interrupted or blocked by browser policy");
        });
      }
    } else {
      videoRef.current.pause();
    }
  }, [isActive, isHovered, isPaused]);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPaused(!isPaused);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col shrink-0 snap-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] w-[280px] sm:w-[320px]"
    >
      {/* Media Box */}
      <div className={`
        relative w-full aspect-[2/3] rounded-[48px] overflow-hidden bg-white border border-stone-200/40
        transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-md origin-center
        ${isActive ? 'scale-[1.1] z-30 shadow-[0_40px_100px_rgba(92,58,33,0.3)]' : 'scale-100 z-10'}
        md:group-hover:scale-[1.1] md:group-hover:z-40 md:group-hover:shadow-[0_40px_100px_rgba(92,58,33,0.3)]
      `}>
        {review.mediaType === 'video' ? (
          <>
            <video 
              ref={videoRef}
              src={review.mediaUrl || ''} 
              className="w-full h-full object-cover" 
              preload="auto" 
              loop 
              muted={isMuted} 
              playsInline 
              crossOrigin="anonymous"
            />
            {/* Video Controls Overlay */}
            <div className={`
              absolute top-6 right-6 z-50 flex items-center gap-3 rounded-full bg-black/30 backdrop-blur-xl px-4 py-2 text-white border border-white/10 shadow-lg transition-opacity duration-300
              ${isActive || isHovered ? 'opacity-100' : 'opacity-0'}
            `}>
              <button onClick={togglePlay} className="hover:scale-110 transition-transform p-1">
                {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button onClick={toggleMute} className="hover:scale-110 transition-transform p-1">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </>
        ) : (
          <Image src={review.mediaUrl} alt="Community Member" className="object-cover" fill sizes="(max-width: 640px) 280px, 320px" />
        )}
      </div>

      {/* Product Details */}
      <div className={`
        mt-12 flex items-center justify-between gap-5 px-3 transition-all duration-700
        ${isActive || isHovered ? 'opacity-100 translate-y-2' : 'opacity-60 md:opacity-0 translate-y-0'}
      `}>
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="relative w-14 h-14 shrink-0 rounded-2xl overflow-hidden bg-white border border-stone-100 shadow-md">
            <Image src={review.product?.image || "/placeholder.png"} alt="Product" className="object-cover" fill sizes="56px" />
          </div>
          <div className="flex-1 min-w-0">
            {review.product && (
              <>
                <Link href={`/products/${review.product.slug}`} className="block group/title">
                  <h3 className="font-serif text-[16px] font-bold text-stone-900 line-clamp-1 group-hover/title:text-amber-800 transition-colors leading-tight">
                    {review.product.name}
                  </h3>
                </Link>
                <p className="text-[13px] text-amber-900 font-bold mt-1 tracking-tight">
                  {formatCurrency(review.product.priceInside, currencyCode)}
                </p>
              </>
            )}
          </div>
        </div>
        {review.product && (
          <QuickAddButton
            product={{ ...(review.product as any), priceOutside: review.product.priceInside }}
            label="ADD +"
            showIcon={false}
            className={`
              px-6 py-3 rounded-full bg-stone-900 text-white text-[11px] font-bold tracking-[0.15em] hover:bg-amber-700 transition-all shadow-xl shadow-stone-900/10 active:scale-95
              ${isActive || isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
            `}
          />
        )}
      </div>
    </div>
  );
}

export function CommunitySlider({ 
  reviews, 
  currencyCode
}: { 
  reviews: CommunityReview[],
  currencyCode: 'USD' | 'NPR'
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  const CARD_WIDTH = isMobile ? 280 : 320;
  const GAP = isMobile ? 24 : 64;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setViewportWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shouldCenterGroup = useMemo(() => {
    if (!viewportWidth) return false;
    const totalContentWidth = (reviews.length * CARD_WIDTH) + ((reviews.length - 1) * GAP);
    return totalContentWidth < (viewportWidth - 48);
  }, [reviews.length, CARD_WIDTH, GAP, viewportWidth]);

  useLayoutEffect(() => {
    if (scrollRef.current && !shouldCenterGroup) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [shouldCenterGroup]);

  const updateScrollButtons = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      updateScrollButtons();
    }
    return () => el?.removeEventListener('scroll', updateScrollButtons);
  }, [updateScrollButtons]);

  useEffect(() => {
    if (!scrollRef.current || shouldCenterGroup) {
      if (shouldCenterGroup) setActiveIndex(-1);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIndex(Number((entry.target as HTMLElement).dataset.index));
          }
        });
      },
      { 
        root: scrollRef.current,
        rootMargin: '0px -45% 0px -45%',
        threshold: 0
      }
    );

    scrollRef.current.querySelectorAll('[data-card]').forEach(c => observer.observe(c));
    return () => observer.disconnect();
  }, [reviews, shouldCenterGroup]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = CARD_WIDTH + GAP;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="w-full relative bg-[#FDFCFB] py-20 md:py-32 overflow-hidden" style={{ isolation: 'isolate' }}>
      <div className="max-w-7xl mx-auto px-6 text-center mb-16 relative z-20">
        <h2 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tighter font-serif italic mb-4 leading-none">Loved by the Community</h2>
        <p className="text-stone-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-light">Join thousands who have transformed their routine with our premium Korean formulas.</p>
      </div>

      <div className="relative">
        {!shouldCenterGroup && (
          <div className="hidden md:block absolute inset-y-0 left-0 right-0 max-w-[95rem] mx-auto px-10 pointer-events-none z-30">
            <button 
              onClick={() => scroll('left')} 
              className={`absolute left-0 top-[40%] w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-stone-50 hover:scale-110 transition-all active:scale-95 pointer-events-auto border border-stone-100 ${!canScrollLeft ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
            >
              <ChevronLeft className="w-7 h-7 text-stone-700" />
            </button>
            <button 
              onClick={() => scroll('right')} 
              className={`absolute right-0 top-[40%] w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-stone-50 hover:scale-110 transition-all active:scale-95 pointer-events-auto border border-stone-100 ${!canScrollRight ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
            >
              <ChevronRight className="w-7 h-7 text-stone-700" />
            </button>
          </div>
        )}

        <div 
          ref={scrollRef} 
          className={`flex pt-16 pb-16 no-scrollbar w-full overflow-x-auto overflow-y-visible relative z-10 snap-x snap-mandatory scroll-smooth ${shouldCenterGroup ? 'justify-center gap-8 md:gap-12' : 'justify-start'}`}
          style={{ 
            gap: shouldCenterGroup ? undefined : `${GAP}px`,
            paddingLeft: shouldCenterGroup ? '24px' : `calc(50vw - ${CARD_WIDTH / 2}px)`,
            paddingRight: shouldCenterGroup ? '24px' : `calc(50vw - ${CARD_WIDTH / 2}px)`
          }}
        >
          {reviews.filter(Boolean).map((review, i) => (
            <div key={i} data-index={i} data-card className="snap-center">
              <CommunityVideoCard 
                review={{...review, product: review.product ? {...review.product, id: (review as any).productId || (review.product as any).id} : undefined} as any}
                isActive={activeIndex === i}
                currencyCode={currencyCode}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
