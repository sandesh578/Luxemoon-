'use client';

import React, { useState, useMemo } from 'react';
import { approveReview, rejectReview, deleteReview, toggleVerifiedPurchase, editReview, toggleReviewVisibility, toggleReviewFeatured } from '../actions';
import { Check, X, Trash, Shield, ShieldCheck, Edit, Search, ChevronLeft, ChevronRight, Eye, EyeOff, Star, Play } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import Image from 'next/image';
import { optimizeImage } from '@/lib/image';

interface Review {
    id: string;
    userName: string;
    address?: string | null;
    rating: number;
    comment: string;
    approved: boolean;
    verifiedPurchase: boolean;
    images: string[];
    video?: string | null;
    isFeatured: boolean;
    isVerified: boolean;
    isHidden: boolean;
    createdAt: string;
    product: { id: string; name: string };
}

const PAGE_SIZE = 20;

export default function AdminReviewsClient({ reviews }: { reviews: Review[] }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'HIDDEN'>('ALL');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [editTarget, setEditTarget] = useState<{ id: string; comment: string; rating: number } | null>(null);

    const filtered = useMemo(() => {
        let result = reviews;
        if (filter === 'PENDING') result = result.filter(r => !r.approved);
        if (filter === 'HIDDEN') result = result.filter(r => r.isHidden);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.userName.toLowerCase().includes(q) ||
                r.product.name.toLowerCase().includes(q) ||
                r.comment.toLowerCase().includes(q)
            );
        }
        return result;
    }, [reviews, filter, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleApprove = async (id: string) => {
        const result = await approveReview(id);
        if (result.success) toast.success('Review approved');
    };

    const handleReject = async (id: string) => {
        const result = await rejectReview(id);
        if (result.success) toast.success('Review rejected');
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const result = await deleteReview(deleteTarget);
        if (result.success) toast.success('Review deleted');
        setDeleteTarget(null);
    };

    const handleToggleVerified = async (id: string, current: boolean) => {
        const result = await toggleVerifiedPurchase(id, !current);
        if (result.success) toast.success(current ? 'Unverified' : 'Marked as verified purchase');
    };

    const handleToggleVisibility = async (id: string, current: boolean) => {
        const result = await toggleReviewVisibility(id, !current);
        if (result.success) toast.success(!current ? 'Review hidden' : 'Review visible');
    };

    const handleToggleFeatured = async (id: string, current: boolean) => {
        const result = await toggleReviewFeatured(id, !current);
        if (result.success) toast.success(!current ? 'Marked as featured' : 'Removed from featured');
    };

    const handleEditSave = async () => {
        if (!editTarget) return;
        const result = await editReview(editTarget.id, editTarget.comment, editTarget.rating);
        if (result.success) toast.success('Review updated');
        setEditTarget(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-stone-900">Review Management</h1>
                <div className="flex gap-4">
                    <div className="text-xs font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                        {reviews.filter(r => !r.approved).length} pending
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-4 border-b border-stone-200 space-y-3">
                    <div className="flex gap-2">
                        {(['ALL', 'PENDING', 'HIDDEN'] as const).map(f => (
                            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${filter === f ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                                {f === 'ALL' ? `All (${reviews.length})` : f === 'PENDING' ? `Pending (${reviews.filter(r => !r.approved).length})` : `Hidden (${reviews.filter(r => r.isHidden).length})`}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input placeholder="Search by customer, product, or comment..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-lg focus:border-amber-500 outline-none" />
                    </div>
                </div>

                <div className="divide-y divide-stone-100">
                    {paginated.map(r => (
                        <div key={r.id} className={`p-4 hover:bg-stone-50/50 transition-colors ${r.isHidden ? 'opacity-60 bg-stone-50' : ''}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-stone-900">{r.userName}</span>
                                        <span className="text-xs text-stone-400">on</span>
                                        <span className="text-xs font-medium text-amber-700">{r.product.name}</span>
                                        {r.isFeatured && (
                                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                                            </span>
                                        )}
                                        {r.verifiedPurchase && (
                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                <ShieldCheck className="w-3 h-3" /> Verified Buyer
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {r.approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 mb-1.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <span key={s} className={`text-sm ${s <= r.rating ? 'text-amber-400' : 'text-stone-200'}`}>★</span>
                                        ))}
                                        <span className="text-xs text-stone-400 ml-2">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-stone-600 leading-relaxed italic">&quot;{r.comment}&quot;</p>

                                    {/* Media Gallery */}
                                    {(r.images.length > 0 || r.video) && (
                                        <div className="flex gap-2 mt-3">
                                            {r.images.map((img, i) => (
                                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-200 shadow-sm">
                                                    <Image src={optimizeImage(img)} alt="" fill className="object-cover" />
                                                </div>
                                            ))}
                                            {r.video && (
                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-stone-900 flex items-center justify-center">
                                                    <Play className="w-6 h-6 text-white" />
                                                    <span className="absolute bottom-1 right-1 text-[8px] font-bold text-white bg-black/50 px-1 rounded">VID</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={() => handleToggleFeatured(r.id, r.isFeatured)} className={`p-1.5 rounded-lg border ${r.isFeatured ? 'bg-amber-50 border-amber-200 text-amber-600' : 'text-stone-400 border-stone-100 hover:bg-stone-50'}`} title="Toggle Featured">
                                        <Star className={`w-4 h-4 ${r.isFeatured ? 'fill-amber-500' : ''}`} />
                                    </button>
                                    <button onClick={() => handleToggleVisibility(r.id, r.isHidden)} className={`p-1.5 rounded-lg border ${r.isHidden ? 'bg-stone-100 border-stone-200 text-stone-600' : 'text-stone-400 border-stone-100 hover:bg-stone-50'}`} title="Toggle Visibility">
                                        {r.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>

                                    <div className="w-px h-6 bg-stone-200 mx-1" />

                                    {!r.approved && (
                                        <button onClick={() => handleApprove(r.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-transparent hover:border-green-200" title="Approve"><Check className="w-4 h-4" /></button>
                                    )}
                                    {r.approved && (
                                        <button onClick={() => handleReject(r.id)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg border border-transparent hover:border-yellow-200" title="Unapprove"><X className="w-4 h-4" /></button>
                                    )}
                                    <button onClick={() => handleToggleVerified(r.id, r.verifiedPurchase)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200" title="Toggle Verified Purchase">
                                        {r.verifiedPurchase ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => setEditTarget({ id: r.id, comment: r.comment, rating: r.rating })} className="p-1.5 text-stone-500 hover:bg-stone-50 rounded-lg border border-transparent hover:border-stone-200" title="Edit Content"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => setDeleteTarget(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200" title="Delete Permanently"><Trash className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {paginated.length === 0 && (
                        <div className="p-12 text-center text-stone-400 italic">No feedback entries found for this category</div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-stone-200 bg-stone-50/50">
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Showing {paginated.length} of {filtered.length} entries</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-2 rounded-xl bg-white border border-stone-200 disabled:opacity-30 shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="flex items-center px-4 text-xs font-bold text-stone-600">Page {page} / {totalPages}</span>
                            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-2 rounded-xl bg-white border border-stone-200 disabled:opacity-30 shadow-sm"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal open={!!deleteTarget} title="Delete Review" message="This will permanently delete this review. This action cannot be undone." variant="danger" confirmLabel="Delete Permanently" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

            {/* Edit Modal */}
            {editTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setEditTarget(null)} />
                    <div className="relative bg-white rounded-[32px] shadow-2xl max-w-lg w-full p-8 space-y-6 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
                        <h3 className="text-2xl font-serif font-bold text-stone-900">Refine Experience</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Customer Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setEditTarget({ ...editTarget, rating: r })}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${editTarget.rating === r ? 'bg-amber-50 border-amber-300 text-amber-600 scale-110 shadow-sm' : 'border-stone-100 text-stone-300 hover:border-stone-200'}`}
                                        >
                                            <Star className={`w-5 h-5 ${editTarget.rating >= r ? 'fill-current' : ''}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Review Content</label>
                                <textarea
                                    className="w-full p-4 border border-stone-100 rounded-2xl bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-200 outline-none transition-all text-sm leading-relaxed"
                                    rows={6}
                                    value={editTarget.comment}
                                    onChange={e => setEditTarget({ ...editTarget, comment: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={() => setEditTarget(null)} className="px-6 py-2.5 text-sm font-bold text-stone-500 hover:bg-stone-50 rounded-xl transition-colors">Discard</button>
                            <button onClick={handleEditSave} className="px-8 py-2.5 text-sm bg-stone-900 text-white font-bold rounded-xl shadow-lg shadow-stone-900/20 active:scale-95 transition-all">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
