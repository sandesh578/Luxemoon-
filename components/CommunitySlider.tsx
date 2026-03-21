'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { OptimizedImage as Image } from '@/components/OptimizedImage';
import { QuickAddButton } from '@/components/QuickAddButton';

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
  currencyCode, 
  formatPrice 
}: { 
  reviews: CommunityReview[],
  currencyCode: 'USD' | 'NPR',
  formatPrice: (val: number) => string
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Intersection Observer to play videos only when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
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

  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="w-full relative py-12">
      <div className="max-w-7xl mx-auto px-4 mb-8 text-center sm:text-left">
        <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-4">Loved by the Community</h2>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory px-4 md:px-8 pb-8 no-scrollbar w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {reviews.map((review, i) => (
          <div 
            key={i} 
            className="snap-start shrink-0 w-[280px] sm:w-[320px] flex flex-col gap-4"
          >
            {/* Media Box */}
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-stone-100 shadow-md">
              {review.mediaType === 'video' ? (
                <video
                  ref={(el) => { videoRefs.current[i] = el; }}
                  src={review.mediaUrl}
                  className="w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={review.mediaUrl}
                  alt="Community Review"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 280px, 320px"
                />
              )}
            </div>

            {/* Product Card */}
            {review.product && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex gap-4 items-center shadow-sm">
                <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white border border-stone-100">
                  <Image
                    src={review.product.image || "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&h=200"}
                    alt={review.product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${review.product.slug}`} className="block">
                    <h3 className="text-sm font-bold text-stone-900 truncate hover:text-amber-700 transition-colors">
                      {review.product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-stone-600 font-medium">
                    {formatPrice(review.product.priceInside)}
                    {review.product.originalPrice && review.product.originalPrice > review.product.priceInside && (
                      <span className="line-through text-stone-400 text-xs ml-2">
                        {formatPrice(review.product.originalPrice)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="shrink-0">
                   {/* Simplified Add to Cart button layout for small card */}
                   <QuickAddButton 
                      product={{ ...(review.product as any), priceOutside: review.product!.priceInside }}
                      className="!p-2 !rounded-lg text-xs"
                   />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Padding spacer at end for smooth scrolling to last item */}
        <div className="shrink-0 w-4 sm:w-8" />
      </div>
    </div>
  );
}
