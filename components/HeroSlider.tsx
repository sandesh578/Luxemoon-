'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Slide {
    image: string;
    mobileImage?: string;
    title: string;
    subtitle: string;
    link: string;
    buttonText: string;
}

export const HeroSlider = ({ slides }: { slides: Slide[] }) => {
    const [current, setCurrent] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const slideCount = slides?.length || 0;

    const scrollToIndex = useCallback((index: number) => {
        if (!scrollRef.current) return;
        const slideWidth = scrollRef.current.clientWidth;
        scrollRef.current.scrollTo({
            left: slideWidth * index,
            behavior: 'smooth'
        });
    }, []);

    useEffect(() => {
        if (slideCount <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => {
                const next = (prev + 1) % slideCount;
                scrollToIndex(next);
                return next;
            });
        }, 6000);
        return () => clearInterval(timer);
    }, [slideCount, scrollToIndex]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const slideWidth = scrollRef.current.clientWidth;
        const scrollPosition = scrollRef.current.scrollLeft;
        const newIndex = Math.round(scrollPosition / slideWidth);
        if (newIndex !== current) {
            setCurrent(newIndex);
        }
    };

    if (!slides || slideCount === 0) return null;

    return (
        <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] md:aspect-video overflow-hidden bg-stone-900 group">
            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar touch-pan-x"
            >
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className="w-full h-full flex-shrink-0 snap-center relative"
                    >
                        {/* Desktop Image */}
                        <Image
                            src={slide.image || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}
                            className={`object-cover object-center ${slide.mobileImage ? 'hidden md:block' : ''}`}
                            alt={slide.title || "Luxe Moon Hero"}
                            fill
                            priority={index === 0}
                            sizes="100vw"
                        />
                        {/* Mobile Image */}
                        {slide.mobileImage && (
                            <Image
                                src={slide.mobileImage}
                                className="object-cover object-center block md:hidden"
                                alt={slide.title || "Luxe Moon Hero Mobile"}
                                fill
                                priority={false}
                                sizes="100vw"
                            />
                        )}
                        
                        {/* Overlay Gradient - Refined to be subtle */}
                        <div className="absolute inset-0 bg-black/15 transition-opacity duration-300 pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 via-black/25 to-transparent pointer-events-none" />

                        <div className="absolute inset-0 flex items-center justify-center text-center px-6 md:px-12">
                            <div className={`max-w-4xl space-y-5 md:space-y-8 transition-all duration-700 w-full`}>
                                <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.08] drop-shadow-lg tracking-tight">
                                    {slide.title}
                                </h2>
                                <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                                    {slide.subtitle}
                                </p>
                                <div className="pt-4 md:pt-8 flex justify-center w-full">
                                    <Link
                                        href={slide.link || '/shop'}
                                        className="inline-flex items-center justify-center gap-3 group px-8 py-3.5 md:px-10 md:py-4 bg-white text-stone-900 font-bold rounded-full hover:bg-stone-100 hover:scale-105 transition-all shadow-xl text-sm md:text-base active:scale-95 border border-white/80"
                                    >
                                        {slide.buttonText || 'SHOP NOW'}
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Slider Controls */}
            {slideCount > 1 && (
                <>
                    {/* Dots Indicator */}
                    <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => scrollToIndex(i)}
                                aria-label={`Go to slide ${i + 1}`}
                                className={`transition-all duration-500 rounded-full h-1.5 ${i === current ? 'w-10 bg-white' : 'w-4 bg-white/40 hover:bg-white/60'}`}
                            />
                        ))}
                    </div>

                    {/* Navigation Arrows */}
                    <button
                        onClick={() => scrollToIndex((current - 1 + slideCount) % slideCount)}
                        aria-label="Previous slide"
                        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white hover:text-stone-900 border border-white/20 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 hidden md:flex"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button
                        onClick={() => scrollToIndex((current + 1) % slideCount)}
                        aria-label="Next slide"
                        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white hover:text-stone-900 border border-white/20 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 hidden md:flex"
                    >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </>
            )}
        </div>
    );
};
