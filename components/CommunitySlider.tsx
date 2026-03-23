'use client';

import React, { useRef, useEffect, useState } from 'react';
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

export function CommunitySlider({ 
  reviews, 
  currencyCode
}: { 
  reviews: CommunityReview[],
  currencyCode: 'USD' | 'NPR'
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [videoControls, setVideoControls] = useState<Record<number, { muted: boolean; paused: boolean }>>({});
  const controlsRef = useRef<Record<number, { muted: boolean; paused: boolean }>>({});

  // Intersection Observer to play videos only when in view
  useEffect(() => {
    controlsRef.current = videoControls;
  }, [videoControls]);

  useEffect(() => {
    setVideoControls((prevControls) => {
      const nextControls: Record<number, { muted: boolean; paused: boolean }> = {};
      reviews.forEach((_, index) => {
        nextControls[index] = prevControls[index] ?? { muted: true, paused: false };
      });
      return nextControls;
    });
  }, [reviews]);

  useEffect(() => {
    reviews.forEach((_, index) => {
      const video = videoRefs.current[index];
      const control = videoControls[index];
      if (video && control) {
        video.muted = control.muted;
      }
    });
  }, [videoControls, reviews]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const index = Number(video.dataset.videoIndex);
          if (Number.isNaN(index)) return;
          const controls = controlsRef.current[index];
          if (entry.isIntersecting) {
            if (!controls?.paused) {
              video.play().catch(() => {});
            }
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [reviews]);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', updateScrollButtons, { passive: true });
    return () => { if (el) el.removeEventListener('scroll', updateScrollButtons); };
  }, [reviews]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.querySelector('[data-card]')?.clientWidth || 300;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -cardWidth - 20 : cardWidth + 20, behavior: 'smooth' });
  };

  const toggleMute = (index: number) => {
    setVideoControls((prev) => {
      const current = prev[index] ?? { muted: true, paused: false };
      const updated = { ...current, muted: !current.muted };
      const video = videoRefs.current[index];
      if (video) video.muted = updated.muted;
      return { ...prev, [index]: updated };
    });
  };

  const togglePlay = (index: number) => {
    setVideoControls((prev) => {
      const current = prev[index] ?? { muted: true, paused: false };
      const nextPaused = !current.paused;
      const video = videoRefs.current[index];
      if (video) {
        if (nextPaused) {
          video.pause();
        } else {
          video.play().catch(() => {});
        }
      }
      return { ...prev, [index]: { ...current, paused: nextPaused } };
    });
  };

  if (!reviews || reviews.length === 0) return null;

  // Use flex-wrap centered layout when items are few (<= 5), horizontal scroll when more
  const useCenteredGrid = reviews.length <= 5;
  const cleanProductName = (name: string) =>
    name
      .replace(/\uFFFD/g, '')
      .replace(/^[^A-Za-z0-9]+/, '')
      .replace(/\s+/g, ' ')
      .trim();

  return (
    <div className="w-full relative py-12 md:py-20 lg:py-24 bg-[#FDFCFB]/50 overflow-hidden">
      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-6 mb-12 md:mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight font-serif italic mb-4">
          Loved by the Community
        </h2>
        <p className="text-stone-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed">Join the thousands who have transformed their beauty routine with our premium Korean formulas.</p>
        <div className="w-16 h-0.5 bg-amber-700 mx-auto mt-6 shadow-sm" />
      </div>

      {/* Navigation Arrows (only for scrollable mode) - Enhanced for touch */}
      {!useCenteredGrid && (
        <>
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-4 md:left-8 top-[60%] -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center hover:bg-stone-50 transition-all duration-300 border border-stone-100 hidden md:flex active:scale-90"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 text-stone-700" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-4 md:right-8 top-[60%] -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center hover:bg-stone-50 transition-all duration-300 border border-stone-100 hidden md:flex active:scale-90"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 text-stone-700" />
            </button>
          )}
        </>
      )}

      {/* Cards Container */}
      <div 
        ref={scrollRef}
        className={
          useCenteredGrid
            ? "flex flex-wrap justify-center gap-6 md:gap-8 px-6 pb-8"
            : "flex gap-5 sm:gap-7 overflow-x-auto snap-x snap-mandatory px-6 md:px-12 pb-12 no-scrollbar w-full"
        }
        style={useCenteredGrid ? {} : { WebkitOverflowScrolling: 'touch' }}
      >
        {reviews.map((review, i) => {
          const controls = videoControls[i] ?? { muted: true, paused: false };
          return (
            <div 
              key={i}
              data-card
              className={`
                group relative flex flex-col transition-all duration-1000 animate-in fade-in slide-in-from-right-8 group-hover:scale-y-[1.04]
                ${review.mediaType === 'video' ? 'md:min-h-[520px]' : ''}
                ${useCenteredGrid 
                  ? 'w-[calc(100%-12px)] sm:w-[300px] md:w-[340px] max-w-[360px]' 
                  : 'snap-start shrink-0 w-[280px] sm:w-[320px] md:w-[340px]'}
              `}
              style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Media Box - with elegant hover effect */}
            <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden bg-stone-100 shadow-sm border border-stone-100 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:shadow-[0_30px_60px_rgba(92,58,33,0.2)] group-hover:-translate-y-5 group-hover:scale-[1.02] group-hover:scale-y-[1.04]">
              {review.mediaType === 'video' ? (
                <video
                  ref={(el) => { videoRefs.current[i] = el; }}
                  src={review.mediaUrl}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  preload="metadata"
                  loop
                  muted
                  playsInline
                  data-video-index={i}
                />
              ) : (
                <Image
                  src={review.mediaUrl}
                  alt="Community Review"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {review.mediaType === 'video' && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded-full bg-white/95 px-2.5 py-1 text-stone-700 shadow-[0_12px_30px_rgba(15,8,3,0.28)] border border-white/60 backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => togglePlay(i)}
                    aria-label={controls.paused ? 'Play video' : 'Pause video'}
                    className="flex items-center justify-center rounded-full p-1.5 hover:bg-stone-100 transition-colors"
                  >
                    {controls.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleMute(i)}
                    aria-label={controls.muted ? 'Unmute video' : 'Mute video'}
                    className="flex items-center justify-center rounded-full p-1.5 hover:bg-stone-100 transition-colors"
                  >
                    {controls.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Product Card - compact */}
            {review.product && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-stone-50 border border-stone-100">
                    <Image
                      src={review.product.image || "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&h=200"}
                      alt={review.product.name}
                      className="object-cover"
                      fill
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${review.product.slug}`} className="block">
                      <h3 className="text-[13px] leading-[1.25] font-semibold text-stone-900 line-clamp-2 break-words hover:text-amber-700 transition-colors">
                        {cleanProductName(review.product.name)}
                      </h3>
                    </Link>
                    <p className="mt-0.5 text-[12px] text-stone-600 font-medium">
                      {formatCurrency(review.product.priceInside, currencyCode)}
                      {review.product.originalPrice && review.product.originalPrice > review.product.priceInside && (
                        <span className="line-through text-stone-400 text-[10px] ml-1">
                          {formatCurrency(review.product.originalPrice, currencyCode)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <QuickAddButton
                  product={{ ...(review.product as any), priceOutside: review.product!.priceInside }}
                  label="Add"
                  showIcon={false}
                  className="inline-flex mx-auto items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#4a2f1d] text-white text-xs font-medium tracking-wide transition-all duration-300 hover:bg-[#3a2416] hover:scale-105 hover:shadow-md active:scale-95"
                />
              </div>
            )}
            </div>
          );
        })}

        {/* Spacer for scroll mode */}
        {!useCenteredGrid && <div className="shrink-0 w-4 sm:w-8" />}
      </div>
    </div>
  );
}

