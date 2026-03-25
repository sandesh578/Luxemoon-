'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, MessageCircle, Play, Plus, Star, Lock } from 'lucide-react';
import { OptimizedImage as Image } from '@/components/OptimizedImage';
import { optimizeImage } from '@/lib/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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

type Props = {
  productId: string;
  reviews: Review[];
};

const REVIEWS_PER_PAGE = 10;

type SessionState = {
  authenticated: boolean;
  user?: {
    userId?: string;
    email?: string;
    name?: string;
  };
};

export default function ProductReviewsSection({ productId, reviews = [] }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>({ authenticated: false });
  const [loadingSession, setLoadingSession] = useState(true);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewMediaModal, setReviewMediaModal] = useState<{ images: string[]; index: number } | null>(null);
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | 'all'>('all');
  const [reviewMediaOnly, setReviewMediaOnly] = useState(false);
  const [reviewSort, setReviewSort] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [reviewForm, setReviewForm] = useState({
    userName: '',
    address: '',
    rating: 0,
    comment: '',
    images: [] as string[],
    video: null as string | null,
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = (await response.json()) as SessionState;
      if (data?.authenticated) {
        setSession(data);
        setReviewForm(prev => ({ ...prev, userName: data.user?.name || '' }));
      } else {
        setSession({ authenticated: false });
      }
    } catch {
      setSession({ authenticated: false });
    } finally {
      setLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const safeReviews = useMemo(() => Array.isArray(reviews) ? reviews : [], [reviews]);
  const avgRating = safeReviews.length > 0 ? (safeReviews.reduce((sum, review) => sum + review.rating, 0) / safeReviews.length).toFixed(1) : null;

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    safeReviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) counts[review.rating as keyof typeof counts]++;
    });
    return counts;
  }, [safeReviews]);

  const featuredReviews = useMemo(() => safeReviews.filter((review) => review.isFeatured), [safeReviews]);
  const standardReviews = useMemo(() => safeReviews.filter((review) => !review.isFeatured), [safeReviews]);

  const filteredStandardReviews = useMemo(() => {
    const base = standardReviews.filter((review) => {
      if (reviewRatingFilter !== 'all' && review.rating !== reviewRatingFilter) return false;
      if (reviewMediaOnly && !(review.images.length > 0 || review.video)) return false;
      return true;
    });

    if (reviewSort === 'highest') return [...base].sort((a, b) => b.rating - a.rating);
    if (reviewSort === 'lowest') return [...base].sort((a, b) => a.rating - b.rating);
    return [...base].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reviewMediaOnly, reviewRatingFilter, reviewSort, standardReviews]);

  const paginatedReviews = useMemo(() => {
    const start = (reviewPage - 1) * REVIEWS_PER_PAGE;
    return filteredStandardReviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [filteredStandardReviews, reviewPage]);

  const compressImageFile = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;
    const bitmap = await createImageBitmap(file);
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const targetWidth = Math.max(1, Math.floor(bitmap.width * scale));
    const targetHeight = Math.max(1, Math.floor(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.84));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let imageCount = reviewForm.images.length;
    setReviewError(null);
    setUploadingMedia(true);

    try {
      for (let index = 0; index < files.length; index++) {
        const rawFile = files[index];
        const file = type === 'image' ? await compressImageFile(rawFile) : rawFile;
        const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

        if (file.size > maxSize) {
          const message = type === 'video'
            ? 'Upload failed. Please try a shorter video (Max 50MB).'
            : 'Upload failed. Please try a smaller image (Max 10MB).';
          setReviewError(message);
          toast.error(message);
          continue;
        }

        if (type === 'image' && imageCount >= 3) {
          const message = 'You can upload up to 3 images per review.';
          setReviewError(message);
          toast.error(message);
          break;
        }

        const signatureResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: 'reviews', assetType: type }),
        });
        if (!signatureResponse.ok) throw new Error('Failed to obtain upload signature');
        const signatureData = await signatureResponse.json();

        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signatureData.signature);
        formData.append('timestamp', signatureData.timestamp);
        formData.append('api_key', signatureData.apiKey);
        formData.append('folder', signatureData.folder);

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/${signatureData.resourceType}/upload`,
          { method: 'POST', body: formData }
        );
        if (!uploadResponse.ok) throw new Error('Upload failed');
        const uploadData = await uploadResponse.json();

        if (type === 'video') {
          setReviewForm((previous) => ({ ...previous, video: uploadData.secure_url }));
        } else {
          imageCount += 1;
          setReviewForm((previous) => ({ ...previous, images: [...previous.images, uploadData.secure_url] }));
        }
      }
    } catch {
      const message = type === 'image'
        ? 'Upload failed. Please try a smaller image (Max 5MB).'
        : 'Upload failed. Please try a shorter video (Max 50MB).';
      setReviewError(message);
      toast.error(message);
    } finally {
      setUploadingMedia(false);
      event.target.value = '';
    }
  };

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setReviewMediaModal(null);
    };

    if (reviewMediaModal) {
      window.addEventListener('keydown', onEsc);
      return () => window.removeEventListener('keydown', onEsc);
    }
  }, [reviewMediaModal]);

  useEffect(() => {
    setReviewPage(1);
  }, [reviewMediaOnly, reviewRatingFilter, reviewSort]);

  return (
    <>
      <div className="mb-16 rounded-[44px] bg-white/95 p-8 shadow-2xl shadow-stone-200/60 ring-1 ring-stone-100 lg:p-14" id="reviews-section">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-stretch lg:justify-between">
          
          {/* Left: Branding & Header */}
          <div className="flex flex-col justify-center lg:max-w-[280px]">
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700 w-fit">
              Community Proof
            </span>
            <h2 className="font-serif text-3xl font-bold text-stone-900 md:text-5xl mt-5 leading-tight">Customer Feed</h2>
            <p className="mt-4 text-base leading-relaxed text-stone-500">Authentic experiences from our beloved community.</p>
          </div>

          {/* Center: Prominent Stats (Vertically Longer) */}
          <div className="flex flex-1 flex-col sm:flex-row items-stretch gap-10 bg-stone-50/80 rounded-[40px] p-8 lg:p-12 border border-stone-100 shadow-inner">
              <div className="w-full sm:w-44 shrink-0 text-center flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-stone-200/60 pb-8 sm:pb-0 sm:pr-10">
                <div className="mb-1 text-7xl font-bold tracking-tighter text-stone-900">{avgRating || '5.0'}</div>
                <div className="mb-3 flex justify-center text-xl text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="drop-shadow-sm">{star <= Math.round(Number(avgRating || 5)) ? '★' : '☆'}</span>
                  ))}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">{reviews.length} Experiences</span>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-3.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingCounts[stars as keyof typeof ratingCounts] || 0;
                  const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : (stars === 5 ? 100 : 0);
                  return (
                    <div key={stars} className="flex cursor-help items-center gap-4 text-sm group">
                      <span className="w-12 text-[11px] font-bold text-stone-500">{stars} Star</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200/50">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(245,158,11,0.3)]" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-10 text-right text-[11px] font-bold text-stone-400">{percent}%</span>
                    </div>
                  );
                })}
              </div>
          </div>

          {/* Right: CTA Section */}
          <div className="flex w-full flex-col items-center justify-center space-y-5 rounded-[40px] border border-amber-100/50 bg-amber-50/50 p-8 text-center lg:w-[280px]">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-xl shadow-amber-900/5 transition-transform hover:scale-110">
              <Star className="h-8 w-8 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">Your glow?</h3>
              <p className="mt-1 text-sm text-stone-600">Share your results today.</p>
            </div>
            
            <div className="w-full pt-2 flex flex-col items-center gap-4">
              <button
                onClick={() => {
                  if (session.authenticated) {
                    document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + '#review-form'));
                  }
                }}
                className="w-full rounded-2xl bg-stone-900 py-4 text-xs font-bold tracking-widest text-white shadow-xl shadow-stone-900/20 transition-all hover:bg-stone-800 active:scale-95"
              >
                {session.authenticated ? 'WRITE A REVIEW' : 'LOGIN TO REVIEW'}
              </button>
              
              {!session.authenticated && !loadingSession && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 bg-white/80 border border-amber-100/50 px-4 py-2 rounded-full shadow-sm">
                  <Lock className="w-3 h-3" />
                  <span className="uppercase tracking-wider">Members Only</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {featuredReviews.length > 0 && (
        <div className="mb-20">
          <div className="mb-8 flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            <h3 className="text-xl font-bold text-stone-900">Featured Experiences</h3>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {featuredReviews.map((review) => (
              <div key={review.id} className="group relative overflow-hidden rounded-[40px] bg-stone-900 p-10 text-white shadow-2xl">
                <div className="absolute right-0 top-0 p-8 opacity-10">
                  <Star className="h-32 w-32 fill-white text-white" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => <span key={star} className="text-xl">{star <= review.rating ? '★' : '☆'}</span>)}
                    </div>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">Spotlight Review</span>
                  </div>
                  <p className="font-serif text-xl italic leading-relaxed text-stone-100 md:text-2xl">&quot;{review.comment}&quot;</p>
                  {review.images.length >= 2 && (
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setReviewMediaModal({ images: review.images, index: 0 })} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10">
                        <Image src={optimizeImage(review.images[0])} alt="Before look" fill sizes="160px" className="object-cover" />
                        <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px]">Before</span>
                      </button>
                      <button type="button" onClick={() => setReviewMediaModal({ images: review.images, index: Math.min(1, review.images.length - 1) })} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10">
                        <Image src={optimizeImage(review.images[Math.min(1, review.images.length - 1)])} alt="After look" fill sizes="160px" className="object-cover" />
                        <span className="absolute right-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] text-white">After</span>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-800 text-lg font-bold">{review.userName.charAt(0)}</div>
                    <div>
                      <span className="block font-bold">{review.userName}</span>
                      <span className="text-xs text-stone-500">{review.address || 'Verified Customer'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredStandardReviews.length > 0 ? (
        <div className="mb-24 space-y-12">
          <div className="flex flex-wrap items-center gap-3">
            <select value={reviewSort} onChange={(event) => setReviewSort(event.target.value as 'recent' | 'highest' | 'lowest')} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
            <select value={reviewRatingFilter} onChange={(event) => setReviewRatingFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <button type="button" onClick={() => setReviewMediaOnly((value) => !value)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${reviewMediaOnly ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-stone-200 bg-white text-stone-600'}`}>
              Media Only
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedReviews.map((review) => (
              <div key={review.id} className="group flex flex-col rounded-3xl border border-stone-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-100 bg-stone-50 text-stone-400 font-bold uppercase">{review.userName.charAt(0)}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-stone-900">{review.userName}</span>
                        {review.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />}
                      </div>
                      <span className="text-[10px] font-medium text-stone-400">{review.address || 'Verified Customer'}</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-[10px] text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => <span key={star}>{star <= review.rating ? '★' : '☆'}</span>)}
                  </div>
                </div>

                <p className="mb-6 flex-1 text-sm italic leading-relaxed text-stone-600">&quot;{review.comment}&quot;</p>

                {(review.images.length > 0 || review.video) && (
                  <div className="mb-6 flex gap-2 overflow-x-auto py-1 no-scrollbar">
                    {review.images.map((image, index) => (
                      <button key={index} type="button" onClick={() => setReviewMediaModal({ images: review.images, index })} className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-stone-100 transition-transform hover:scale-105">
                        <Image src={optimizeImage(image)} alt="" fill className="object-cover" />
                      </button>
                    ))}
                    {review.video && (
                      <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-900">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-stone-50 pt-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  {review.isVerified && <span className="text-stone-900">Verified Purchase</span>}
                </div>
              </div>
            ))}
          </div>

          {filteredStandardReviews.length > REVIEWS_PER_PAGE && (
            <div className="flex items-center justify-center gap-4">
              <button disabled={reviewPage === 1} onClick={() => { setReviewPage((page) => page - 1); document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-full border border-stone-200 p-3 transition-colors hover:bg-stone-50 disabled:opacity-30">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-bold text-stone-500">Page {reviewPage} of {Math.ceil(filteredStandardReviews.length / REVIEWS_PER_PAGE)}</span>
              <button disabled={reviewPage >= Math.ceil(filteredStandardReviews.length / REVIEWS_PER_PAGE)} onClick={() => { setReviewPage((page) => page + 1); document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-full border border-stone-200 p-3 transition-colors hover:bg-stone-50 disabled:opacity-30">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-24 rounded-[40px] border border-stone-100 bg-stone-50 py-20 text-center dashed">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-stone-300" />
          <p className="font-medium italic text-stone-500">
            {standardReviews.length > 0 ? 'No reviews match your filters yet.' : 'No reviews yet. Be the first to share the Luxe Moon glow!'}
          </p>
        </div>
      )}

      {session.authenticated && !reviewSubmitted ? (
        <div id="review-form" className="relative mx-auto max-w-xl overflow-hidden rounded-3xl border border-stone-100 bg-white p-6 shadow-xl md:p-10">
          <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200" />

          <div className="mb-8 text-center">
            <h3 className="mb-2 font-serif text-2xl font-bold text-stone-900">Share Your Experience</h3>
            <p className="text-sm text-stone-500">Your feedback helps us perfect the art of hair care.</p>
          </div>

          <form onSubmit={async (event) => {
            event.preventDefault();
            if (submittingReview || uploadingMedia) return;
            setReviewError(null);

            if (!reviewForm.rating || reviewForm.rating < 1) {
              const message = 'Kindly select a rating before submitting.';
              setReviewError(message);
              toast.error(message);
              return;
            }
            if (!reviewForm.userName || reviewForm.userName.trim().length < 2) {
              const message = 'Please share your experience so we can help others shine.';
              setReviewError(message);
              toast.error(message);
              return;
            }
            if (!reviewForm.comment || reviewForm.comment.trim().length < 10) {
              const message = 'Please share your experience so we can help others shine.';
              setReviewError(message);
              toast.error(message);
              return;
            }

            setSubmittingReview(true);
            try {
              const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...reviewForm, productId }),
              });
              if (response.ok) {
                setReviewSubmitted(true);
                toast.success('Your review has been submitted for approval!');
                setReviewForm({ userName: session.user?.name || '', address: '', rating: 0, comment: '', images: [], video: null });
              } else {
                const data = await response.json();
                const message = data.error || 'We could not submit your review right now. Please try again in a moment.';
                setReviewError(message);
                toast.error(message);
              }
            } catch {
              const message = 'We could not submit your review right now. Please try again in a moment.';
              setReviewError(message);
              toast.error(message);
            } finally {
              setSubmittingReview(false);
            }
          }} className="space-y-8">
            {reviewError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            <div className="flex flex-col items-center">
              <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-stone-400">Overall Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setReviewForm((previous) => ({ ...previous, rating: star }))} className="group relative">
                    <Star className={`h-8 w-8 transition-all duration-300 ${star <= reviewForm.rating ? 'scale-110 fill-amber-400 text-amber-400' : 'text-stone-200 hover:text-stone-300'}`} />
                  </button>
                ))}
              </div>
              {reviewForm.rating < 1 && <p className="mt-2 text-[11px] text-stone-400">Select 1 to 5 stars</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400">Full Name *</label>
                <input value={reviewForm.userName} onChange={(event) => setReviewForm((previous) => ({ ...previous, userName: event.target.value }))} className="w-full rounded-xl bg-stone-50 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-amber-200 border-none" placeholder="e.g. Aavya Sharma" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400">Location</label>
                <input maxLength={100} value={reviewForm.address} onChange={(event) => setReviewForm((previous) => ({ ...previous, address: event.target.value }))} className="w-full rounded-xl bg-stone-50 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-amber-200 border-none" placeholder="e.g. New York, USA" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400">Your Message *</label>
              <textarea maxLength={2000} rows={4} value={reviewForm.comment} onChange={(event) => setReviewForm((previous) => ({ ...previous, comment: event.target.value }))} className="w-full resize-none rounded-xl bg-stone-50 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-amber-200 border-none" placeholder="How did this product change your hair routine?" />
            </div>

            <div className="space-y-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-500">Visual Feedback (Optional)</label>
              <div className="flex flex-wrap gap-4">
                {reviewForm.images.map((image, index) => (
                  <div key={index} className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-stone-100 shadow-sm">
                    <Image src={optimizeImage(image)} alt="" fill className="object-cover" />
                    <button type="button" onClick={() => setReviewForm((previous) => ({ ...previous, images: previous.images.filter((_, currentIndex) => currentIndex !== index) }))} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 shadow-md opacity-0 transition-opacity group-hover:opacity-100">
                      <Plus className="h-4 w-4 rotate-45" />
                    </button>
                  </div>
                ))}

                {reviewForm.video && (
                  <div className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-stone-900 shadow-sm">
                    <Play className="h-8 w-8 text-white" />
                    <button type="button" onClick={() => setReviewForm((previous) => ({ ...previous, video: null }))} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 shadow-md opacity-0 transition-opacity group-hover:opacity-100">
                      <Plus className="h-4 w-4 rotate-45" />
                    </button>
                  </div>
                )}

                {reviewForm.images.length < 3 && (
                  <label className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 transition-all hover:border-amber-300 hover:bg-stone-50 ${uploadingMedia ? 'pointer-events-none opacity-50' : ''}`}>
                    <Plus className="mb-1 h-6 w-6 text-stone-300" />
                    <span className="text-[10px] font-bold uppercase text-stone-400">Image</span>
                    <input type="file" accept="image/*" multiple onChange={(event) => handleMediaUpload(event, 'image')} className="hidden" />
                  </label>
                )}

                {!reviewForm.video && (
                  <label className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 transition-all hover:border-amber-300 hover:bg-stone-50 ${uploadingMedia ? 'pointer-events-none opacity-50' : ''}`}>
                    <Play className="mb-1 h-5 w-5 text-stone-300" />
                    <span className="text-[10px] font-bold uppercase text-stone-400">Video</span>
                    <input type="file" accept="video/mp4" onChange={(event) => handleMediaUpload(event, 'video')} className="hidden" />
                  </label>
                )}
              </div>
              <p className="text-[10px] text-stone-400">Max 3 images (5MB each) and 1 short video (50MB).</p>
            </div>

            <button type="submit" disabled={submittingReview || uploadingMedia} className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-sm font-bold text-white shadow-xl shadow-stone-900/10 transition-all active:scale-[0.98] hover:bg-stone-800 disabled:opacity-50">
              {submittingReview ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />PUBLISHING...</> : uploadingMedia ? 'UPLOADING MEDIA...' : 'SEND YOUR EXPERIENCE'}
            </button>
          </form>
        </div>
      ) : session.authenticated && reviewSubmitted ? (
        <div className="mx-auto max-w-xl space-y-4 rounded-[48px] border border-amber-100 bg-amber-50 p-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl">
            <CheckCircle2 className="h-10 w-10 text-amber-500" />
          </div>
          <h3 className="font-serif text-3xl font-bold text-stone-900">Experience Received</h3>
          <p className="text-stone-600">Thank you for sharing your journey. Our team will verify and feature it soon!</p>
          <button onClick={() => setReviewSubmitted(false)} className="text-sm font-bold text-amber-600 hover:underline">Write another review</button>
        </div>
      ) : !loadingSession && (
        <div className="mx-auto max-w-xl space-y-6 rounded-[48px] border border-amber-100 bg-amber-50/50 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl">
            <Lock className="h-10 w-10 text-amber-500" />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-stone-900">Join the Community</h3>
            <p className="mt-2 text-stone-600">Please log in to your account to share your experience with this product.</p>
          </div>
          <button
            onClick={() => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + '#review-form'))}
            className="rounded-2xl bg-stone-900 px-10 py-4 text-sm font-bold text-white shadow-xl shadow-stone-900/20 transition-all hover:bg-stone-800 active:scale-95"
          >
            LOGIN TO YOUR ACCOUNT
          </button>
        </div>
      )}

      {reviewMediaModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setReviewMediaModal(null)}>
          <button type="button" className="absolute right-6 top-6 h-10 w-10 rounded-full bg-white/10 text-2xl leading-none text-white" onClick={() => setReviewMediaModal(null)} aria-label="Close media preview">
            x
          </button>
          <div className="relative w-full max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/15">
              <Image src={optimizeImage(reviewMediaModal.images[reviewMediaModal.index])} alt="Review media" fill sizes="90vw" className="bg-black object-contain" />
            </div>
            {reviewMediaModal.images.length > 1 && (
              <>
                <button type="button" onClick={() => setReviewMediaModal((previous) => previous ? ({ ...previous, index: (previous.index - 1 + previous.images.length) % previous.images.length }) : previous)} className="absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/80 text-stone-900">
                  <ChevronLeft className="mx-auto h-5 w-5" />
                </button>
                <button type="button" onClick={() => setReviewMediaModal((previous) => previous ? ({ ...previous, index: (previous.index + 1) % previous.images.length }) : previous)} className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/80 text-stone-900">
                  <ChevronRight className="mx-auto h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
