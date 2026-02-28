'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShieldCheck, Star, Minus, Plus, ShoppingBag, ChevronLeft, ChevronRight, Play, Truck, RotateCcw, Share2, Facebook, MessageCircle, Copy, CheckCircle2, HelpCircle, Check } from 'lucide-react';
import { useCart, useLocationContext, useConfig } from '@/components/Providers';
import { OptimizedImage as Image } from '@/components/OptimizedImage';
import { optimizeImage } from '@/lib/image';
import { toast } from 'sonner';
import DOMPurify from 'isomorphic-dompurify';

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

export default function ProductPageClient({ product }: { product: ProductData }) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [showVideo, setShowVideo] = useState(false);
    const [activeTab, setActiveTab] = useState<'benefits' | 'ingredients' | 'usage' | 'faq'>('benefits');
    const [copied, setCopied] = useState(false);

    const sanitizedDescription = useMemo(() => {
        if (!product.marketingDescription) return null;
        return DOMPurify.sanitize(product.marketingDescription);
    }, [product.marketingDescription]);

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

    // Review State
    const [reviewForm, setReviewForm] = useState<{
        userName: string,
        address: string,
        rating: number,
        comment: string,
        images: string[],
        video: string | null
    }>({ userName: '', address: '', rating: 5, comment: '', images: [], video: null });

    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // Pagination
    const [reviewPage, setReviewPage] = useState(1);
    const REVIEWS_PER_PAGE = 6;

    const price = isInsideValley ? product.priceInside : product.priceOutside;

    const { reviews } = product;
    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    const ratingCounts = useMemo(() => {
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) {
                counts[r.rating as keyof typeof counts]++;
            }
        });
        return counts;
    }, [reviews]);

    const featuredReviews = useMemo(() => reviews.filter(r => r.isFeatured), [reviews]);
    const standardReviews = useMemo(() => reviews.filter(r => !r.isFeatured), [reviews]);

    const paginatedReviews = useMemo(() => {
        const start = (reviewPage - 1) * REVIEWS_PER_PAGE;
        return standardReviews.slice(start, start + REVIEWS_PER_PAGE);
    }, [standardReviews, reviewPage]);

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

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        let imageCount = reviewForm.images.length;
        setUploadingMedia(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Max size validation
                const maxSize = type === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    toast.error(`${file.name} is too large. Max ${type === 'video' ? '50MB' : '5MB'}`);
                    continue;
                }

                if (type === 'image' && imageCount >= 3) {
                    toast.error('Maximum 3 images allowed');
                    break;
                }

                // Get signature
                const sigRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ context: 'reviews', assetType: type })
                });
                if (!sigRes.ok) throw new Error('Failed to obtain upload signature');
                const sigData = await sigRes.json();

                const formData = new FormData();
                formData.append('file', file);
                formData.append('signature', sigData.signature);
                formData.append('timestamp', sigData.timestamp);
                formData.append('api_key', sigData.apiKey);
                formData.append('folder', sigData.folder);

                const uploadRes = await fetch(
                    `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${sigData.resourceType}/upload`,
                    { method: 'POST', body: formData }
                );
                if (!uploadRes.ok) throw new Error('Upload failed');
                const uploadData = await uploadRes.json();

                if (type === 'video') {
                    setReviewForm(prev => ({ ...prev, video: uploadData.secure_url }));
                } else {
                    imageCount += 1;
                    setReviewForm(prev => ({ ...prev, images: [...prev.images, uploadData.secure_url] }));
                }
            }
        } catch (error) {
            toast.error('Failed to upload media');
        } finally {
            setUploadingMedia(false);
            e.target.value = '';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
            <Link href="/shop" prefetch={false} className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-6">
                <ChevronLeft className="w-4 h-4" /> Back to Shop
            </Link>

            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
                {/* Image Gallery */}
                <div className="w-full md:w-1/2 space-y-4">
                    <div
                        className="relative w-full pt-[100%] rounded-2xl overflow-hidden bg-stone-100 group"
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
                                loading="lazy"
                                className="object-cover"
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
                        {product.discountPercent && product.discountPercent > 0 && (
                            <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                -{product.discountPercent}%
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {product.images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => { setSelectedImage(i); setShowVideo(false); }}
                                className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${selectedImage === i && !showVideo ? 'border-amber-500' : 'border-transparent'
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
                        <span className="text-4xl font-bold text-stone-900">NPR {price.toLocaleString()}</span>
                        {product.originalPrice && product.originalPrice > price && (
                            <span className="text-lg text-stone-400 line-through">NPR {product.originalPrice.toLocaleString()}</span>
                        )}
                    </div>

                    <div className="prose-sm sm:prose-base max-w-none text-stone-600 prose-headings:font-serif prose-headings:text-stone-900 prose-a:text-amber-600">
                        {sanitizedDescription ? (
                            <div dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
                        ) : (
                            <p>{product.description}</p>
                        )}
                    </div>

                    {/* Marketing Tabs */}
                    <div className="pt-8 border-t border-stone-100">
                        <div className="flex gap-6 border-b border-stone-100 overflow-x-auto no-scrollbar mb-6">
                            {[
                                { id: 'benefits', label: 'Benefits' },
                                { id: 'ingredients', label: 'Ingredients' },
                                { id: 'usage', label: 'How to Use' },
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
                            <div className="flex items-center gap-4">
                                <div className="flex items-center border border-stone-200 rounded-xl bg-white">
                                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-stone-50"><Minus className="w-4 h-4" /></button>
                                    <span className="px-4 font-bold text-lg">{quantity}</span>
                                    <button type="button" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-3 hover:bg-stone-50"><Plus className="w-4 h-4" /></button>
                                </div>
                                <button
                                    onClick={() => { addToCart(product as any, quantity); toast.success('Added to bag!'); }}
                                    className="flex-1 py-4 bg-stone-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 active:scale-[0.98]"
                                >
                                    <ShoppingBag className="w-5 h-5" /> ADD TO BAG
                                </button>
                            </div>
                            {/* Trust Microcopy */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-500 font-medium">
                                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-green-600" /> Authentic Korean Formula</span>
                                <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-amber-600" /> Free Delivery over NPR {config.freeDeliveryThreshold.toLocaleString()}</span>
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

            {/* Transformation Section */}
            {product.transformations && product.transformations.length > 0 && (
                <section className="mt-24 pt-24 border-t border-stone-100">
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

            {/* Reviews Section */}
            <div className="mt-24 pt-24 border-t border-stone-100" id="reviews-section">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
                    <div>
                        <h2 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 leading-tight">Customer Feed</h2>
                        <p className="text-stone-500 mt-3 text-lg">Authentic experiences from our beloved community.</p>

                        <div className="mt-8 flex items-center gap-6">
                            <div className="text-center bg-stone-50 px-8 py-6 rounded-3xl border border-stone-100">
                                <div className="text-5xl font-bold text-stone-900 mb-1 leading-none">{avgRating || "5.0"}</div>
                                <div className="flex text-amber-500 text-sm justify-center mb-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <span key={s}>{s <= Math.round(Number(avgRating || 5)) ? '★' : '☆'}</span>
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{reviews.length} Experiences</span>
                            </div>

                            <div className="flex-1 space-y-2 min-w-[200px]">
                                {[5, 4, 3, 2, 1].map(stars => {
                                    const count = ratingCounts[stars as keyof typeof ratingCounts] || 0;
                                    const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : (stars === 5 ? 100 : 0);
                                    return (
                                        <div key={stars} className="flex items-center gap-3 text-sm group cursor-help">
                                            <span className="w-12 text-stone-500 text-xs font-bold">{stars} Star</span>
                                            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                            <span className="w-8 text-right text-stone-400 text-[10px] font-bold">{percent}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-1/3 p-8 bg-amber-50 rounded-[32px] border border-amber-100/50 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-stone-900">Your hair journey matters.</h3>
                        <p className="text-stone-600 text-sm">Help the community by sharing your results today.</p>
                        <button
                            onClick={() => document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-3 bg-stone-900 text-white rounded-2xl font-bold text-sm hover:bg-stone-800 transition-colors shadow-xl shadow-stone-900/20"
                        >
                            WRITE A REVIEW
                        </button>
                    </div>
                </div>

                {/* Featured Reviews */}
                {featuredReviews.length > 0 && (
                    <div className="mb-20">
                        <div className="flex items-center gap-2 mb-8">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            <h3 className="text-xl font-bold text-stone-900">Featured Experiences</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {featuredReviews.map(r => (
                                <div key={r.id} className="bg-stone-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Star className="w-32 h-32 text-white fill-white" />
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-1 text-amber-400">
                                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-xl">{s <= r.rating ? '★' : '☆'}</span>)}
                                            </div>
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Spotlight Review</span>
                                        </div>
                                        <p className="text-xl md:text-2xl font-serif italic leading-relaxed text-stone-100">&quot;{r.comment}&quot;</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center font-bold text-lg">{r.userName.charAt(0)}</div>
                                            <div>
                                                <span className="block font-bold">{r.userName}</span>
                                                <span className="text-xs text-stone-500">{r.address || 'Verified Customer'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Standard Reviews Grid */}
                {standardReviews.length > 0 ? (
                    <div className="space-y-12 mb-24">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {paginatedReviews.map(r => (
                                <div key={r.id} className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center font-bold text-stone-400 border border-stone-100 uppercase">{r.userName.charAt(0)}</div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-stone-900 text-sm">{r.userName}</span>
                                                    {r.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                                                </div>
                                                <span className="text-[10px] text-stone-400 font-medium">{r.address || 'Nepal'}</span>
                                            </div>
                                        </div>
                                        <div className="flex text-amber-400 text-[10px] gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= r.rating ? '★' : '☆'}</span>)}
                                        </div>
                                    </div>

                                    <p className="text-sm text-stone-600 leading-relaxed italic mb-6 flex-1">&quot;{r.comment}&quot;</p>

                                    {/* Review Media */}
                                    {(r.images.length > 0 || r.video) && (
                                        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar py-1">
                                            {r.images.map((img, i) => (
                                                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-stone-100">
                                                    <Image src={optimizeImage(img)} alt="" fill className="object-cover" />
                                                </div>
                                            ))}
                                            {r.video && (
                                                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-stone-900 flex items-center justify-center">
                                                    <Play className="w-6 h-6 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-stone-50 flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                        {r.isVerified && <span className="text-stone-900">Verified Purchase</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {standardReviews.length > REVIEWS_PER_PAGE && (
                            <div className="flex justify-center items-center gap-4">
                                <button
                                    disabled={reviewPage === 1}
                                    onClick={() => { setReviewPage(p => p - 1); document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                                    className="p-3 rounded-full border border-stone-200 disabled:opacity-30 hover:bg-stone-50 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-bold text-stone-500">
                                    Page {reviewPage} of {Math.ceil(standardReviews.length / REVIEWS_PER_PAGE)}
                                </span>
                                <button
                                    disabled={reviewPage >= Math.ceil(standardReviews.length / REVIEWS_PER_PAGE)}
                                    onClick={() => { setReviewPage(p => p + 1); document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                                    className="p-3 rounded-full border border-stone-200 disabled:opacity-30 hover:bg-stone-50 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-stone-50 rounded-[40px] border border-stone-100 dashed mb-24">
                        <MessageCircle className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                        <p className="text-stone-500 font-medium italic">No reviews yet. Be the first to share the Luxe Moon glow!</p>
                    </div>
                )}

                {/* Review Form */}
                {!reviewSubmitted ? (
                    <div id="review-form" className="max-w-xl mx-auto bg-white p-6 md:p-10 rounded-3xl border border-stone-100 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200" />

                        <div className="text-center mb-8">
                            <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">Share Your Experience</h3>
                            <p className="text-sm text-stone-500">Your feedback helps us perfect the art of hair care.</p>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (submittingReview || uploadingMedia) return;

                            if (!reviewForm.userName || reviewForm.userName.trim().length < 2) {
                                toast.error('Please enter your Full Name (minimum 2 characters).');
                                return;
                            }
                            if (!reviewForm.comment || reviewForm.comment.trim().length < 10) {
                                toast.error('Please share a slightly longer message (minimum 10 characters).');
                                return;
                            }

                            setSubmittingReview(true);
                            try {
                                const res = await fetch('/api/reviews', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ...reviewForm, productId: product.id }),
                                });
                                if (res.ok) {
                                    setReviewSubmitted(true);
                                    toast.success('Your review has been submitted for approval!');
                                    setReviewForm({ rating: 5, userName: '', address: '', comment: '', images: [], video: null });
                                } else {
                                    const data = await res.json();
                                    toast.error(data.error || 'Failed to submit review');
                                }
                            } catch {
                                toast.error('Something went wrong. Please try again.');
                            } finally {
                                setSubmittingReview(false);
                            }
                        }} className="space-y-8">
                            <div className="flex flex-col items-center">
                                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Overall Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setReviewForm(p => ({ ...p, rating: s }))}
                                            className="group relative"
                                        >
                                            <Star
                                                className={`w-8 h-8 transition-all duration-300 ${s <= reviewForm.rating ? 'text-amber-400 fill-amber-400 scale-110' : 'text-stone-200 hover:text-stone-300'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest">Full Name *</label>
                                    <input value={reviewForm.userName} onChange={e => setReviewForm(p => ({ ...p, userName: e.target.value }))} className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-200 transition-all" placeholder="e.g. Aavya Sharma" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest">Location</label>
                                    <input maxLength={100} value={reviewForm.address} onChange={e => setReviewForm(p => ({ ...p, address: e.target.value }))} className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-200 transition-all" placeholder="e.g. Kathmandu, Nepal" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest">Your Message *</label>
                                <textarea maxLength={2000} rows={4} value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-200 transition-all resize-none" placeholder="How did this product change your hair routine?" />
                            </div>

                            {/* Media Uploads */}
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Visual Feedback (Optional)</label>
                                <div className="flex flex-wrap gap-4">
                                    {/* Previews */}
                                    {reviewForm.images.map((img, i) => (
                                        <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-stone-100 shadow-sm group">
                                            <Image src={optimizeImage(img)} alt="" fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setReviewForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                                                className="absolute top-1 right-1 bg-white/90 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Plus className="w-4 h-4 rotate-45" />
                                            </button>
                                        </div>
                                    ))}

                                    {reviewForm.video && (
                                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-stone-900 flex items-center justify-center shadow-sm group">
                                            <Play className="w-8 h-8 text-white" />
                                            <button
                                                type="button"
                                                onClick={() => setReviewForm(prev => ({ ...prev, video: null }))}
                                                className="absolute top-1 right-1 bg-white/90 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Plus className="w-4 h-4 rotate-45" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Upload Buttons */}
                                    {reviewForm.images.length < 3 && (
                                        <label className={`w-24 h-24 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 hover:border-amber-300 transition-all ${uploadingMedia ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <Plus className="w-6 h-6 text-stone-300 mb-1" />
                                            <span className="text-[10px] font-bold text-stone-400 uppercase">Image</span>
                                            <input type="file" accept="image/*" multiple onChange={e => handleMediaUpload(e, 'image')} className="hidden" />
                                        </label>
                                    )}

                                    {!reviewForm.video && (
                                        <label className={`w-24 h-24 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 hover:border-amber-300 transition-all ${uploadingMedia ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <Play className="w-5 h-5 text-stone-300 mb-1" />
                                            <span className="text-[10px] font-bold text-stone-400 uppercase">Video</span>
                                            <input type="file" accept="video/mp4" onChange={e => handleMediaUpload(e, 'video')} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                <p className="text-[10px] text-stone-400">Max 3 images (5MB each) and 1 short video (50MB).</p>
                            </div>

                            <button
                                type="submit"
                                disabled={submittingReview || uploadingMedia}
                                className="w-full py-4 bg-stone-900 text-white font-bold text-sm rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-all shadow-xl shadow-stone-900/10 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {submittingReview ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        PUBLISHING...
                                    </>
                                ) : uploadingMedia ? (
                                    'UPLOADING MEDIA...'
                                ) : (
                                    'SEND YOUR EXPERIENCE'
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="max-w-xl mx-auto bg-amber-50 p-12 rounded-[48px] border border-amber-100 text-center space-y-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                            <CheckCircle2 className="w-10 h-10 text-amber-500" />
                        </div>
                        <h3 className="font-serif text-3xl font-bold text-stone-900">Experience Received</h3>
                        <p className="text-stone-600">Thank you for sharing your journey. Our team will verify and feature it soon!</p>
                        <button onClick={() => setReviewSubmitted(false)} className="text-sm font-bold text-amber-600 hover:underline">Write another review</button>
                    </div>
                )}
            </div>

            {/* Sticky Mobile CTA */}
            {product.stock > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 lg:hidden z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-lg bg-white/80">
                    <button
                        onClick={() => { addToCart(product as any, quantity); toast.success('Added to bag!'); }}
                        className="w-full py-4 bg-stone-900 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform"
                    >
                        <ShoppingBag className="w-5 h-5" /> ADD TO BAG — NPR {price.toLocaleString()}
                    </button>
                </div>
            )}
        </div>
    );
}
