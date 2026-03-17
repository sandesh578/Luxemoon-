'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ShieldCheck, Star, Minus, Plus, ShoppingBag, ChevronLeft, ChevronRight, Play, Truck, RotateCcw, MessageCircle, Copy, CheckCircle2, HelpCircle, Check, Leaf, Droplets, FlaskConical, AlertCircle } from 'lucide-react';
import { useCart, useLocationContext, useConfig } from '@/components/Providers';
import { OptimizedImage as Image } from '@/components/OptimizedImage';
import { optimizeImage } from '@/lib/image';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { QuickAddButton } from '@/components/QuickAddButton';

const ProductReviewsSection = dynamic(() => import('@/components/products/ProductReviewsSection'));

interface Review {
    id: string;
    userName: string;
    address?: string | null;
    rating: number;
    comment: string;
    verifiedPurchase: boolean;
    images: string[];
    video?: string | null;
    isFeatured: boolean;
    isVerified: boolean;
    createdAt: string;
}

interface Transformation {
    id: string;
    beforeImage: string;
    afterImage: string;
    caption?: string | null;
    durationUsed?: string | null;
    isFeatured: boolean;
    createdAt: string;
}

interface FAQ {
    question?: string;
    answer?: string;
    q?: string;
    a?: string;
}

interface RelatedProduct {
    id: string;
    slug: string;
    name: string;
    priceInside: number;
    originalPrice?: number | null;
    images: string[];
}

interface ProductData {
    id: string;
    slug: string;
    name: string;
    description: string;
    marketingDescription?: string | null;
    sanitizedMarketingDescription?: string | null;
    ingredients?: string | null;
    howToUse?: string | null;
    benefits: string[];
    comparisonImages: string[];
    faqs: FAQ[];
    priceInside: number;
    priceOutside: number;
    originalPrice?: number | null;
    category: string;
    images: string[];
    features: string[];
    stock: number;
    videoUrl?: string | null;
    discountPercent?: number;
    weight?: string | null;
    tags?: string[];
    relatedProducts?: RelatedProduct[];
    reviews: Review[];
    transformations: Transformation[];
}

function getVideoEmbed(url: string): string | null {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
}

import { calculateDiscountedPrice } from '@/lib/settings';

export default function ProductPageClient({ product }: { product: ProductData }) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [showVideo, setShowVideo] = useState(false);
    const [activeTab, setActiveTab] = useState<'benefits' | 'ingredients' | 'usage' | 'who' | 'faq'>('benefits');
    const [copied, setCopied] = useState(false);
    const [cartError, setCartError] = useState<string | null>(null);
    const [comparePosition, setComparePosition] = useState(52);
    const [showDesktopStickyBuy, setShowDesktopStickyBuy] = useState(false);
    const [recentlyViewed, setRecentlyViewed] = useState<RelatedProduct[]>([]);

    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const mediaCount = product.images.length + (product.videoUrl ? 1 : 0);
    const currentIndex = showVideo ? product.images.length : selectedImage;

    const handleNext = () => {
        const nextIndex = (currentIndex + 1) % mediaCount;
        setSlideFromIndex(nextIndex);
    };

    const handlePrev = () => {
        const prevIndex = (currentIndex - 1 + mediaCount) % mediaCount;
        setSlideFromIndex(prevIndex);
    };

    const setSlideFromIndex = (index: number) => {
        if (product.videoUrl && index === product.images.length) {
            setShowVideo(true);
        } else {
            setShowVideo(false);
            setSelectedImage(index);
        }
    };

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > 50) handleNext();
        if (distance < -50) handlePrev();
    };
    const { addToCart } = useCart();
    const { isInsideValley } = useLocationContext();
    const config = useConfig();
    const formatPrice = (amount: number) => formatCurrency(amount, config.currencyCode);

    const basePrice = isInsideValley ? product.priceInside : product.priceOutside;
    const price = calculateDiscountedPrice(basePrice, product as any, config as any);
    const { reviews } = product;
    const derivedDiscount = product.discountPercent && product.discountPercent > 0
        ? product.discountPercent
        : (product.originalPrice && product.originalPrice > price)
            ? Math.max(1, Math.round(((product.originalPrice - price) / product.originalPrice) * 100))
            : 0;
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
        : null;

    const compareItem = product.transformations?.[0] || null;
    const lifestyleImages = product.comparisonImages?.length
        ? product.comparisonImages.slice(0, 2)
        : product.images.slice(0, 2);

    const embedUrl = product.videoUrl ? getVideoEmbed(product.videoUrl) : null;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const handleShare = (platform: 'fb' | 'wa' | 'copy') => {
        if (platform === 'fb') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        } else if (platform === 'wa') {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(product.name + ' - ' + shareUrl)}`, '_blank');
        } else {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Product link copied successfully');
        }
    };

    const handleAddToCart = () => {
        try {
            setCartError(null);
            addToCart(product as any, quantity);
            toast.success('Added to cart!');
        } catch {
            const msg = "We couldn't add this item. Please refresh and try again.";
            setCartError(msg);
            toast.error(msg);
        }
    };

    const detailHighlights = [
        { icon: CheckCircle2, text: product.features[0] || 'Smooth Finish' },
        { icon: Droplets, text: product.features[1] || 'Deep Hydration' },
        { icon: Leaf, text: product.features[2] || 'Keratin Infused' },
        { icon: FlaskConical, text: product.features[3] || 'Biotin Strength' },
    ];

    useEffect(() => {
        const onScroll = () => {
            setShowDesktopStickyBuy(window.scrollY > 540);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);


    useEffect(() => {
        try {
            const key = 'lm_recent_products';
            const stored = localStorage.getItem(key);
            const parsed = stored ? (JSON.parse(stored) as RelatedProduct[]) : [];
            const current: RelatedProduct = {
                id: product.id,
                slug: product.slug,
                name: product.name,
                priceInside: product.priceInside,
                originalPrice: product.originalPrice || null,
                images: product.images,
            };
            const next = [current, ...parsed.filter(p => p.id !== current.id)].slice(0, 8);
            localStorage.setItem(key, JSON.stringify(next));
            setRecentlyViewed(next.filter(p => p.id !== product.id).slice(0, 4));
        } catch {
            setRecentlyViewed([]);
        }
    }, [product.id, product.slug, product.name, product.priceInside, product.originalPrice, product.images]);


    return (
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 min-h-screen">
            <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-6">
                <ChevronLeft className="w-4 h-4" /> Back to Shop
            </Link>

            <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-start animate-in fade-in duration-700">
                {/* Image Gallery */}
                <div className="w-full md:w-1/2 space-y-4">
                    <div
                        className="relative w-full pt-[100%] rounded-[28px] overflow-hidden bg-stone-100 group shadow-[0_20px_60px_rgba(92,58,33,0.15)]"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        {showVideo && product.videoUrl ? (
                            embedUrl ? (
                                <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen />
                            ) : (
                                <video src={product.videoUrl} controls className="absolute inset-0 w-full h-full object-cover" />
                            )
                        ) : (
                            <Image
                                src={optimizeImage(product.images[selectedImage] || product.images[0])}
                                alt={product.name}
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                priority
                                className="object-cover transition-transform duration-500 md:group-hover:scale-110"
                            />
                        )}
                        {mediaCount > 1 && (
                            <>
                                <button onClick={(e) => { e.preventDefault(); handlePrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full hidden md:flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronLeft className="w-5 h-5 text-stone-800" />
                                </button>
                                <button onClick={(e) => { e.preventDefault(); handleNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full hidden md:flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="w-5 h-5 text-stone-800" />
                                </button>
                            </>
                        )}
                        {derivedDiscount > 0 && (
                            <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                -{derivedDiscount}%
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {product.images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => { setSelectedImage(i); setShowVideo(false); }}
                                className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i && !showVideo ? 'border-amber-500 shadow-lg shadow-amber-200/60' : 'border-transparent hover:border-stone-200'
                                    }`}
                            >
                                <Image src={optimizeImage(img)} alt="" fill sizes="80px" className="object-cover" />
                            </button>
                        ))}
                        {product.videoUrl && (
                            <button
                                onClick={() => setShowVideo(true)}
                                className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 bg-stone-900 flex items-center justify-center transition-colors ${showVideo ? 'border-amber-500' : 'border-transparent'
                                    }`}
                            >
                                <Play className="w-6 h-6 text-white" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Product Info */}
                <div className="w-full md:w-1/2 space-y-6 flex flex-col">
                    <div>
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-amber-700 tracking-wider uppercase">{product.category}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleShare('wa')} className="p-2 text-stone-400 hover:text-[#25D366] transition-colors" title="Share on WhatsApp">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.031 0C5.385 0 0 5.388 0 12.031c0 2.125.553 4.195 1.604 6.01L.226 23.468l5.584-1.464a12.023 12.023 0 006.221 1.733h.005c6.643 0 12.034-5.388 12.034-12.035A12.023 12.023 0 0020.547 3.52 11.967 11.967 0 0012.031 0zm0 2.016c2.673 0 5.184 1.042 7.073 2.932a9.982 9.982 0 012.933 7.087c-.003 5.512-4.485 9.996-9.998 9.996-1.89 0-3.74-.492-5.364-1.42l-.384-.22-3.987 1.046 1.064-3.886-.24-.383C1.65 15.308 1.11 13.682 1.11 12.031c0-5.514 4.49-10.015 10.005-10.015h-.084zm-5.42 5.044c-.2.002-.556.074-.845.39-.292.316-1.112 1.085-1.112 2.645 0 1.56 1.14 3.067 1.298 3.277.158.212 2.235 3.411 5.412 4.784.755.326 1.345.522 1.805.668.76.242 1.45.207 1.995.126.608-.09 1.874-.766 2.138-1.507.264-.74.264-1.375.185-1.507-.08-.13-.292-.21-.608-.368-.316-.158-1.874-.925-2.164-1.03-.29-.106-.5-.158-.71.157-.21.316-.816 1.03-.998 1.24-.184.21-.368.237-.684.08-.316-.158-1.336-.492-2.545-1.572-.94-.84-1.576-1.878-1.76-2.193-.184-.316-.02-.488.138-.646.142-.142.316-.368.474-.553.158-.184.21-.316.316-.526.105-.21.052-.395-.026-.553-.08-.158-.71-1.71-.974-2.342-.258-.616-.52-.533-.71-.543-.183-.01-.394-.012-.605-.012z" /></svg>
                                </button>
                                <button onClick={() => handleShare('fb')} className="p-2 text-stone-400 hover:text-[#1877F2] transition-colors" title="Share on Facebook">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                </button>
                                <button onClick={() => handleShare('copy')} className="p-2 text-stone-400 hover:text-stone-900 transition-colors" title={copied ? "Copied!" : "Copy Link"}>
                                    {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <h1 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 mt-1">{product.name}</h1>
                        <p className="mt-3 text-stone-600 text-lg leading-relaxed max-w-xl">
                            {product.features[0] || 'Designed for a silky, glass-like finish with salon-grade Korean care.'}
                        </p>
                        {avgRating && (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <span key={s} className={`text-sm ${s <= Math.round(Number(avgRating)) ? 'text-amber-400' : 'text-stone-200'}`}>★</span>
                                    ))}
                                </div>
                                <span className="text-sm text-stone-500">{avgRating} ({product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''})</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold text-stone-900">{formatPrice(price)}</span>
                        {product.originalPrice && product.originalPrice > price && (
                            <span className="text-lg text-stone-400 line-through">{formatPrice(product.originalPrice)}</span>
                        )}
                        {derivedDiscount > 0 && (
                            <span className="text-sm font-bold text-amber-700 bg-amber-50 px-2 py-1 border border-amber-200 shadow-sm rounded-md">
                                {derivedDiscount}% OFF
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {config.showStockOnProduct && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${product.stock > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                            </span>
                        )}
                        {product.weight && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold border bg-white text-stone-600 border-stone-200">
                                {product.weight}
                            </span>
                        )}
                    </div>

                    <div className="prose-sm sm:prose-base max-w-none text-stone-600 prose-headings:font-serif prose-headings:text-stone-900 prose-a:text-amber-600">
                        {product.sanitizedMarketingDescription ? (
                            <div dangerouslySetInnerHTML={{ __html: product.sanitizedMarketingDescription }} />
                        ) : (
                            <p>{product.description}</p>
                        )}
                    </div>

                    {/* Marketing Tabs */}
                    <div className="pt-8 border-t border-stone-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            {detailHighlights.map(({ icon: Icon, text }, idx) => (
                                <div key={idx} className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-stone-100 bg-white shadow-sm">
                                    <Icon className="w-4 h-4 text-amber-600" />
                                    <span className="text-sm text-stone-700">{text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-6 border-b border-stone-100 overflow-x-auto no-scrollbar mb-6">
                            {[
                                { id: 'benefits', label: 'Benefits' },
                                { id: 'ingredients', label: 'Ingredients' },
                                { id: 'usage', label: 'How to Use' },
                                { id: 'who', label: 'Who Its For' },
                                { id: 'faq', label: 'FAQ' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`pb-3 text-sm font-bold tracking-wide uppercase transition-all whitespace-nowrap border-b-2 ${activeTab === tab.id ? 'border-amber-600 text-stone-900' : 'border-transparent text-stone-400'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[200px] animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {activeTab === 'benefits' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {product.benefits.length > 0 ? (
                                        product.benefits.map((benefit, i) => (
                                            <div key={i} className="flex gap-3 bg-stone-50 p-4 rounded-xl border border-stone-100">
                                                <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                                <span className="text-sm text-stone-700 font-medium">{benefit}</span>
                                            </div>
                                        ))
                                    ) : (
                                        product.features.map((f, i) => (
                                            <div key={i} className="flex gap-3 bg-stone-50 p-4 rounded-xl border border-stone-100">
                                                <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                                <span className="text-sm text-stone-700 font-medium">{f}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'ingredients' && (
                                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 italic text-stone-600 text-sm leading-relaxed">
                                    {product.ingredients || "Handpicked premium botanical ingredients. Contact support for a full detailed list."}
                                </div>
                            )}

                            {activeTab === 'usage' && (
                                <div className="space-y-4">
                                    {product.howToUse ? (
                                        <div className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{product.howToUse}</div>
                                    ) : (
                                        <p className="text-stone-400 text-sm italic">Detailed usage instructions coming soon.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'who' && (
                                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-sm leading-relaxed text-stone-700">
                                    Ideal for hair that is dry, frizzy, damaged, color-treated, or prone to breakage. Best for anyone seeking smoother texture, deep nourishment, and shine without heavy buildup.
                                </div>
                            )}

                            {activeTab === 'faq' && (
                                <div className="space-y-4">
                                    {product.faqs && product.faqs.length > 0 ? (
                                        product.faqs.map((faq, i) => (
                                            <details key={i} className="group bg-white border border-stone-100 rounded-xl overflow-hidden shadow-sm">
                                                <summary className="p-4 flex justify-between items-center cursor-pointer font-bold text-sm text-stone-900 list-none">
                                                    <span className="flex items-center gap-2">
                                                        <HelpCircle className="w-4 h-4 text-amber-600" />
                                                        {faq.q || faq.question}
                                                    </span>
                                                    <Plus className="w-4 h-4 group-open:rotate-45 transition-transform" />
                                                </summary>
                                                <div className="px-4 pb-4 pt-0 text-sm text-stone-600 leading-relaxed border-t border-stone-50">
                                                    {faq.a || faq.answer}
                                                </div>
                                            </details>
                                        ))
                                    ) : (
                                        <p className="text-stone-400 text-sm italic">No FAQs available for this product yet.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Add to Cart */}
                    {product.stock > 0 ? (
                        <div className="space-y-4 pt-8">
                            {cartError && (
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{cartError}</span>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                <div className="flex items-center justify-center border border-stone-200 rounded-xl bg-white">
                                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-stone-50"><Minus className="w-4 h-4" /></button>
                                    <span className="px-4 font-bold text-lg">{quantity}</span>
                                    <button type="button" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-3 hover:bg-stone-50"><Plus className="w-4 h-4" /></button>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 min-w-0 py-4 px-6 bg-gradient-to-r from-[#5C3A21] to-[#C7782A] text-white font-bold rounded-2xl flex items-center justify-center gap-2 whitespace-nowrap transition-all shadow-xl shadow-amber-200/40 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98]"
                                >
                                    <ShoppingBag className="w-5 h-5" /> ADD TO CART
                                </button>
                            </div>
                            {/* Trust Microcopy */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-500 font-medium">
                                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-green-600" /> Authentic Korean Formula</span>
                                <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-amber-600" /> Free Delivery over {formatPrice(config.freeDeliveryThreshold)}</span>
                                <span>COD Available</span>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-center bg-stone-100 rounded-xl text-stone-500 font-bold border-2 border-dashed border-stone-200">
                            Currently Out of Stock
                        </div>
                    )}

                    {/* Delivery & Refund Blocks */}
                    <div className="grid grid-cols-2 gap-3 pt-6">
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-center space-y-1">
                            <Truck className="w-5 h-5 mx-auto text-amber-600" />
                            <p className="text-xs font-bold text-stone-800">Fast Delivery</p>
                            <p className="text-[10px] text-stone-500">{isInsideValley ? config.estimatedDeliveryInside : config.estimatedDeliveryOutside}</p>
                        </div>
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-center space-y-1">
                            <RotateCcw className="w-5 h-5 mx-auto text-amber-600" />
                            <p className="text-xs font-bold text-stone-800">Easy Returns</p>
                            <p className="text-[10px] text-stone-500">7-day return policy</p>
                        </div>
                    </div>
                </div>
            </div>

            {product.relatedProducts && product.relatedProducts.length > 0 && (
                <section className="mt-16 content-auto">
                    <div className="bg-white rounded-[28px] border border-stone-100 shadow-sm p-6 md:p-8">
                        <div className="flex items-end justify-between mb-6">
                            <div>
                                <h3 className="font-serif text-2xl text-stone-900">Frequently Bought Together</h3>
                                <p className="text-sm text-stone-500">Complete your ritual with curated pairings.</p>
                            </div>
                            <Link href="/shop" className="text-sm font-bold text-amber-700 hover:underline">Explore More</Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {product.relatedProducts.map((rp) => (
                                <div key={rp.id} className="rounded-2xl border border-stone-100 p-4 bg-stone-50/60 lux-hover-lift">
                                    <Link href={`/products/${rp.slug}`} className="block">
                                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white mb-3">
                                            <Image src={optimizeImage(rp.images[0])} alt={rp.name} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
                                        </div>
                                        <h4 className="font-bold text-stone-900 text-sm line-clamp-2">{rp.name}</h4>
                                        <p className="text-sm text-stone-600 mt-1">{formatPrice(rp.priceInside)}</p>
                                    </Link>
                                    <div className="mt-3">
                                        <QuickAddButton product={{ ...rp, category: product.category, priceOutside: rp.priceInside, description: '', features: [], stock: 99 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {recentlyViewed.length > 0 && (
                <section className="mt-12 content-auto">
                    <h3 className="font-serif text-2xl text-stone-900 mb-5">Recently Viewed</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {recentlyViewed.map((rp) => (
                            <Link key={rp.id} href={`/products/${rp.slug}`} className="rounded-2xl border border-stone-100 bg-white p-3 hover:shadow-lg transition-shadow">
                                <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                                    <Image src={optimizeImage(rp.images[0])} alt={rp.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" />
                                </div>
                                <p className="text-sm font-semibold text-stone-900 line-clamp-2">{rp.name}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Lifestyle Context */}
            {lifestyleImages.length > 0 && (
                <section className="mt-20 pt-20 border-t border-stone-100 animate-in fade-in duration-700">
                    <div className="text-center space-y-3 mb-10">
                        <span className="text-amber-600 font-bold text-xs tracking-widest uppercase">K-Beauty Ritual</span>
                        <h2 className="text-3xl md:text-4xl font-serif text-stone-900">Modern Care, Minimal Luxury.</h2>
                        <p className="text-stone-500 max-w-2xl mx-auto">Inspired by Korean self-care rituals with soft textures, clean spaces, and refined daily routines.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {lifestyleImages.map((img, i) => (
                            <div key={`${img}-${i}`} className="relative aspect-[5/3] rounded-[28px] overflow-hidden border border-stone-100 shadow-lg shadow-stone-200/60 group">
                                <Image
                                    src={optimizeImage(img)}
                                    alt={i === 0 ? `${product.name} lifestyle use` : `${product.name} premium bathroom aesthetic`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Before / After Slider */}
            {compareItem && (
                <section className="mt-20 animate-in fade-in duration-700">
                    <div className="max-w-4xl mx-auto bg-white rounded-[32px] border border-stone-100 shadow-xl p-5 md:p-8">
                        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                            <div>
                                <h3 className="font-serif text-2xl text-stone-900">Visible Transformation</h3>
                                <p className="text-sm text-stone-500">Slide to compare real customer progress.</p>
                            </div>
                            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-amber-50 border border-amber-100 text-amber-700">Real Customer Result</span>
                        </div>
                        <div className="relative aspect-[16/10] rounded-2xl overflow-hidden select-none">
                            <Image
                                src={optimizeImage(compareItem.beforeImage)}
                                alt="Before transformation"
                                fill
                                sizes="(max-width: 768px) 100vw, 900px"
                                className="object-cover"
                            />
                            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}>
                                <Image
                                    src={optimizeImage(compareItem.afterImage)}
                                    alt="After transformation"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 900px"
                                    className="object-cover"
                                />
                            </div>
                            <div className="absolute inset-y-0" style={{ left: `${comparePosition}%` }}>
                                <div className="relative h-full w-px bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]" />
                                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-xl border border-stone-200 flex items-center justify-center text-stone-700 font-bold">||</div>
                            </div>
                            <span className="absolute top-3 left-3 bg-stone-900/70 text-white text-xs px-3 py-1 rounded-full">After 1 Use</span>
                            <span className="absolute top-3 right-3 bg-amber-500/90 text-white text-xs px-3 py-1 rounded-full">After 2 Weeks</span>
                            <input
                                type="range"
                                min={5}
                                max={95}
                                value={comparePosition}
                                onChange={(e) => setComparePosition(Number(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                                aria-label="Before and after comparison slider"
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Transformation Section */}
            {product.transformations && product.transformations.length > 0 && (
                <section className="mt-24 pt-24 border-t border-stone-100 content-auto">
                    <div className="text-center space-y-4 mb-12">
                        <span className="text-amber-600 font-bold text-xs tracking-widest uppercase">Real Transformations</span>
                        <h2 className="text-3xl md:text-4xl font-serif text-stone-900">Proven Results. Radiant Hair.</h2>
                        <p className="text-stone-500 max-w-lg mx-auto">See the journey of our customers who transitioned to Luxe Moon.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12">
                        {product.transformations.map((t, i) => (
                            <div key={t.id} className="group bg-white rounded-[32px] overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-500">
                                <div className="grid grid-cols-2 gap-1 p-2">
                                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                                        <Image src={optimizeImage(t.beforeImage)} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" alt="Before" />
                                        <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Before</span>
                                    </div>
                                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                                        <Image src={optimizeImage(t.afterImage)} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover animate-pulse-slow" alt="After" />
                                        <span className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">After</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-stone-900 mb-1">{t.caption || "Amazing Results"}</h3>
                                    <div className="flex items-center justify-between">
                                        {t.durationUsed && <span className="text-xs text-stone-500 font-medium">Used for: {t.durationUsed}</span>}
                                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Verified Result</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="mt-24">
                <ProductReviewsSection productId={product.id} reviews={reviews} />
            </div>

            {product.stock > 0 && showDesktopStickyBuy && (
                <div className="hidden lg:block fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-white/95 backdrop-blur-xl border border-stone-200 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-5">
                        <div>
                            <p className="text-xs text-stone-500">{product.name}</p>
                            <p className="font-bold text-stone-900">{formatPrice(price)}</p>
                        </div>
                        <div className="flex items-center border border-stone-200 rounded-xl bg-white">
                            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-stone-50"><Minus className="w-4 h-4" /></button>
                            <span className="px-3 font-bold">{quantity}</span>
                            <button type="button" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-2 hover:bg-stone-50"><Plus className="w-4 h-4" /></button>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="px-6 py-3 bg-gradient-to-r from-[#5C3A21] to-[#C7782A] text-white font-bold rounded-xl flex items-center gap-2 whitespace-nowrap hover:-translate-y-0.5 transition-transform"
                        >
                            <ShoppingBag className="w-4 h-4" /> Add to Cart
                        </button>
                    </div>
                </div>
            )}

            {/* Sticky Mobile CTA */}
            {product.stock > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 lg:hidden z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-lg bg-white/80">
                    <button
                        onClick={handleAddToCart}
                        className="w-full py-4 bg-gradient-to-r from-[#5C3A21] to-[#C7782A] text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform"
                    >
                        <ShoppingBag className="w-5 h-5" /> ADD TO CART - {formatPrice(price)}
                    </button>
                </div>
            )}
        </div>
    );
}







