'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Star, Minus, Plus, ShoppingBag, ChevronLeft, ChevronRight, Play, Truck, RotateCcw, MessageCircle, Copy, CheckCircle2, HelpCircle, Check, Leaf, Droplets, FlaskConical, AlertCircle } from 'lucide-react';
import { useCart, useLocationContext, useConfig } from '@/components/Providers';
import { OptimizedImage as Image } from '@/components/OptimizedImage';
import { optimizeImage } from '@/lib/image';
import { toast } from 'sonner';
import DOMPurify from 'isomorphic-dompurify';
import { QuickAddButton } from '@/components/QuickAddButton';

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
    const [activeTab, setActiveTab] = useState<'benefits' | 'ingredients' | 'usage' | 'who' | 'faq'>('benefits');
    const [copied, setCopied] = useState(false);
    const [cartError, setCartError] = useState<string | null>(null);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [comparePosition, setComparePosition] = useState(52);
    const [reviewMediaModal, setReviewMediaModal] = useState<{ images: string[]; index: number } | null>(null);
    const [showDesktopStickyBuy, setShowDesktopStickyBuy] = useState(false);
    const [reviewRatingFilter, setReviewRatingFilter] = useState<number | 'all'>('all');
    const [reviewMediaOnly, setReviewMediaOnly] = useState(false);
    const [reviewSort, setReviewSort] = useState<'recent' | 'highest' | 'lowest'>('recent');
    const [recentlyViewed, setRecentlyViewed] = useState<RelatedProduct[]>([]);

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
    }>({ userName: '', address: '', rating: 0, comment: '', images: [], video: null });

    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // Pagination
    const [reviewPage, setReviewPage] = useState(1);
    const REVIEWS_PER_PAGE = 10;

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
    const filteredStandardReviews = useMemo(() => {
        const base = standardReviews.filter(r => {
            if (reviewRatingFilter !== 'all' && r.rating !== reviewRatingFilter) return false;
            if (reviewMediaOnly && !(r.images.length > 0 || r.video)) return false;
            return true;
        });

        if (reviewSort === 'highest') return [...base].sort((a, b) => b.rating - a.rating);
        if (reviewSort === 'lowest') return [...base].sort((a, b) => a.rating - b.rating);
        return [...base].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [standardReviews, reviewRatingFilter, reviewMediaOnly, reviewSort]);
    const compareItem = product.transformations?.[0] || null;
    const lifestyleImages = product.comparisonImages?.length
        ? product.comparisonImages.slice(0, 2)
        : product.images.slice(0, 2);

    const paginatedReviews = useMemo(() => {
        const start = (reviewPage - 1) * REVIEWS_PER_PAGE;
        return filteredStandardReviews.slice(start, start + REVIEWS_PER_PAGE);
    }, [filteredStandardReviews, reviewPage]);

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
        setReviewError(null);
        setUploadingMedia(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const rawFile = files[i];
                const file = type === 'image' ? await compressImageFile(rawFile) : rawFile;

                // Max size validation
                const maxSize = type === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    const msg = type === 'video'
                        ? 'Upload failed. Please try a shorter video (Max 50MB).'
                        : 'Upload failed. Please try a smaller image (Max 5MB).';
                    setReviewError(msg);
                    toast.error(msg);
                    continue;
                }

                if (type === 'image' && imageCount >= 3) {
                    const msg = 'You can upload up to 3 images per review.';
                    setReviewError(msg);
                    toast.error(msg);
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
            const msg = type === 'image'
                ? 'Upload failed. Please try a smaller image (Max 5MB).'
                : 'Upload failed. Please try a shorter video (Max 50MB).';
            setReviewError(msg);
            toast.error(msg);
        } finally {
            setUploadingMedia(false);
            e.target.value = '';
        }
    };

    const handleAddToCart = () => {
        try {
            setCartError(null);
            addToCart(product as any, quantity);
            toast.success('Added to bag!');
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

    const compressImageFile = async (file: File): Promise<File> => {
        if (!file.type.startsWith('image/')) return file;
        const bitmap = await createImageBitmap(file);
        const maxDim = 1600;
        const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
        const targetW = Math.max(1, Math.floor(bitmap.width * scale));
        const targetH = Math.max(1, Math.floor(bitmap.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;
        ctx.drawImage(bitmap, 0, 0, targetW, targetH);
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.84));
        if (!blob) return file;
        return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
    };

    useEffect(() => {
        const onScroll = () => {
            setShowDesktopStickyBuy(window.scrollY > 540);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setReviewMediaModal(null);
        };
        if (reviewMediaModal) {
            window.addEventListener('keydown', onEsc);
            return () => window.removeEventListener('keydown', onEsc);
        }
    }, [reviewMediaModal]);

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

    useEffect(() => {
        setReviewPage(1);
    }, [reviewRatingFilter, reviewMediaOnly, reviewSort]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 min-h-screen">
            <Link href="/shop" prefetch={false} className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-6">
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
                        <span className="text-4xl font-bold text-stone-900">NPR {price.toLocaleString()}</span>
                        {product.originalPrice && product.originalPrice > price && (
                            <span className="text-lg text-stone-400 line-through">NPR {product.originalPrice.toLocaleString()}</span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${product.stock > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                        {product.weight && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold border bg-white text-stone-600 border-stone-200">
                                {product.weight}
                            </span>
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
                            <div className="flex items-center gap-4">
                                <div className="flex items-center border border-stone-200 rounded-xl bg-white">
                                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-stone-50"><Minus className="w-4 h-4" /></button>
                                    <span className="px-4 font-bold text-lg">{quantity}</span>
                                    <button type="button" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-3 hover:bg-stone-50"><Plus className="w-4 h-4" /></button>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 py-4 bg-gradient-to-r from-[#5C3A21] to-[#C7782A] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-200/40 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98]"
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
                                        <p className="text-sm text-stone-600 mt-1">NPR {rp.priceInside.toLocaleString()}</p>
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

            {/* Reviews Section */}
            <div className="mt-24 pt-24 border-t border-stone-100 content-auto" id="reviews-section">
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
                                        {r.images.length >= 2 && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setReviewMediaModal({ images: r.images, index: 0 })}
                                                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10"
                                                >
                                                    <Image src={optimizeImage(r.images[0])} alt="Before look" fill sizes="160px" className="object-cover" />
                                                    <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/50">Before</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setReviewMediaModal({ images: r.images, index: Math.min(1, r.images.length - 1) })}
                                                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10"
                                                >
                                                    <Image src={optimizeImage(r.images[Math.min(1, r.images.length - 1)])} alt="After look" fill sizes="160px" className="object-cover" />
                                                    <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/90 text-white">After</span>
                                                </button>
                                            </div>
                                        )}
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
                {filteredStandardReviews.length > 0 ? (
                    <div className="space-y-12 mb-24">
                        <div className="flex flex-wrap gap-3 items-center">
                            <select
                                value={reviewSort}
                                onChange={(e) => setReviewSort(e.target.value as 'recent' | 'highest' | 'lowest')}
                                className="px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white"
                            >
                                <option value="recent">Most Recent</option>
                                <option value="highest">Highest Rated</option>
                                <option value="lowest">Lowest Rated</option>
                            </select>
                            <select
                                value={reviewRatingFilter}
                                onChange={(e) => setReviewRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white"
                            >
                                <option value="all">All Ratings</option>
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>
                            <button
                                type="button"
                                onClick={() => setReviewMediaOnly(v => !v)}
                                className={`px-3 py-2 rounded-xl border text-sm font-semibold ${reviewMediaOnly ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-stone-600 border-stone-200'}`}
                            >
                                Media Only
                            </button>
                        </div>
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
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setReviewMediaModal({ images: r.images, index: i })}
                                                    className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-stone-100 hover:scale-105 transition-transform"
                                                >
                                                    <Image src={optimizeImage(img)} alt="" fill className="object-cover" />
                                                </button>
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
                        {filteredStandardReviews.length > REVIEWS_PER_PAGE && (
                            <div className="flex justify-center items-center gap-4">
                                <button
                                    disabled={reviewPage === 1}
                                    onClick={() => { setReviewPage(p => p - 1); document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                                    className="p-3 rounded-full border border-stone-200 disabled:opacity-30 hover:bg-stone-50 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-bold text-stone-500">
                                    Page {reviewPage} of {Math.ceil(filteredStandardReviews.length / REVIEWS_PER_PAGE)}
                                </span>
                                <button
                                    disabled={reviewPage >= Math.ceil(filteredStandardReviews.length / REVIEWS_PER_PAGE)}
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
                        <p className="text-stone-500 font-medium italic">
                            {standardReviews.length > 0 ? 'No reviews match your filters yet.' : 'No reviews yet. Be the first to share the Luxe Moon glow!'}
                        </p>
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
                            setReviewError(null);

                            if (!reviewForm.rating || reviewForm.rating < 1) {
                                const msg = 'Kindly select a rating before submitting.';
                                setReviewError(msg);
                                toast.error(msg);
                                return;
                            }
                            if (!reviewForm.userName || reviewForm.userName.trim().length < 2) {
                                const msg = 'Please share your experience so we can help others shine.';
                                setReviewError(msg);
                                toast.error(msg);
                                return;
                            }
                            if (!reviewForm.comment || reviewForm.comment.trim().length < 10) {
                                const msg = 'Please share your experience so we can help others shine.';
                                setReviewError(msg);
                                toast.error(msg);
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
                                    setReviewForm({ rating: 0, userName: '', address: '', comment: '', images: [], video: null });
                                } else {
                                    const data = await res.json();
                                    const msg = data.error || 'We could not submit your review right now. Please try again in a moment.';
                                    setReviewError(msg);
                                    toast.error(msg);
                                }
                            } catch {
                                const msg = 'We could not submit your review right now. Please try again in a moment.';
                                setReviewError(msg);
                                toast.error(msg);
                            } finally {
                                setSubmittingReview(false);
                            }
                        }} className="space-y-8">
                            {reviewError && (
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{reviewError}</span>
                                </div>
                            )}
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
                                {reviewForm.rating < 1 && (
                                    <p className="text-[11px] text-stone-400 mt-2">Select 1 to 5 stars</p>
                                )}
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

            {reviewMediaModal && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReviewMediaModal(null)}>
                    <button
                        type="button"
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white text-2xl leading-none"
                        onClick={() => setReviewMediaModal(null)}
                        aria-label="Close media preview"
                    >
                        x
                    </button>
                    <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/15">
                            <Image
                                src={optimizeImage(reviewMediaModal.images[reviewMediaModal.index])}
                                alt="Review media"
                                fill
                                sizes="90vw"
                                className="object-contain bg-black"
                            />
                        </div>
                        {reviewMediaModal.images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setReviewMediaModal(prev => prev ? ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }) : prev)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 text-stone-900"
                                >
                                    <ChevronLeft className="w-5 h-5 mx-auto" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReviewMediaModal(prev => prev ? ({ ...prev, index: (prev.index + 1) % prev.images.length }) : prev)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 text-stone-900"
                                >
                                    <ChevronRight className="w-5 h-5 mx-auto" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {product.stock > 0 && showDesktopStickyBuy && (
                <div className="hidden lg:block fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-white/95 backdrop-blur-xl border border-stone-200 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-5">
                        <div>
                            <p className="text-xs text-stone-500">{product.name}</p>
                            <p className="font-bold text-stone-900">NPR {price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center border border-stone-200 rounded-xl bg-white">
                            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-stone-50"><Minus className="w-4 h-4" /></button>
                            <span className="px-3 font-bold">{quantity}</span>
                            <button type="button" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-2 hover:bg-stone-50"><Plus className="w-4 h-4" /></button>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="px-6 py-3 bg-gradient-to-r from-[#5C3A21] to-[#C7782A] text-white font-bold rounded-xl flex items-center gap-2 hover:-translate-y-0.5 transition-transform"
                        >
                            <ShoppingBag className="w-4 h-4" /> Add to Bag
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
                        <ShoppingBag className="w-5 h-5" /> ADD TO BAG — NPR {price.toLocaleString()}
                    </button>
                </div>
            )}
        </div>
    );
}
