'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OptimizedImage as Image } from '@/components/OptimizedImage';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Slide {
    image: string;
    title: string;
    subtitle: string;
    link: string;
    buttonText: string;
}

export const HeroSlider = ({ slides }: { slides: Slide[] }) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length]);

    if (!slides || slides.length === 0) return null;

    return (
        <div className="relative h-[85vh] md:h-[90vh] w-full overflow-hidden bg-stone-900">
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <Image
                        src={slide.image || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}
                        fill
                        className="object-cover"
                        alt={slide.title}
                        sizes="100vw"
                        priority={index === 0}
                        loading={index === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/10 to-transparent" />

                    <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                        <div className={`max-w-4xl space-y-6 transition-all duration-700 ${index === current ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                            <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl text-stone-50 leading-[1.1]">
                                {slide.title}
                            </h2>
                            <p className="text-stone-200 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
                                {slide.subtitle}
                            </p>
                            <div className="pt-6">
                                <Link
                                    href={slide.link || '/shop'}
                                    className="inline-flex items-center gap-2 group px-8 py-4 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-500 transition-all shadow-xl shadow-amber-900/20"
                                >
                                    {slide.buttonText || 'SHOP COLLECTION'}
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {slides.length > 1 && (
                <>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-1.5 transition-all duration-300 rounded-full ${i === current ? 'w-8 bg-amber-500' : 'w-4 bg-white/30'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-white/20 transition-colors backdrop-blur-md hidden md:block"
                    >
                        <ChevronLeft />
                    </button>
                    <button
                        onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-white/20 transition-colors backdrop-blur-md hidden md:block"
                    >
                        <ChevronRight />
                    </button>
                </>
            )}
        </div>
    );
};
