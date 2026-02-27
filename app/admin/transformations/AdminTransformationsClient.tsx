'use client';

import React, { useState } from 'react';
import { createTransformation, updateTransformation, deleteTransformation } from '../actions';
import { Trash, Edit, Plus, X, Upload, Check, ChevronRight, Star } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import Image from 'next/image';
import { optimizeImage } from '@/lib/image';

interface Transformation {
    id: string;
    beforeImage: string;
    afterImage: string;
    caption?: string | null;
    durationUsed?: string | null;
    isFeatured: boolean;
    productId: string;
    product: { name: string };
}

interface Product {
    id: string;
    name: string;
}

export default function AdminTransformationsClient({
    transformations,
    products
}: {
    transformations: Transformation[],
    products: Product[]
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        beforeImage: '',
        afterImage: '',
        caption: '',
        durationUsed: '',
        productId: products[0]?.id || '',
        isFeatured: false
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'beforeImage' | 'afterImage') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const sigRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context: 'products', assetType: 'image' })
            });
            if (!sigRes.ok) throw new Error('Failed to obtain upload signature');
            const sigData = await sigRes.json();

            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('signature', sigData.signature);
            uploadData.append('timestamp', sigData.timestamp);
            uploadData.append('api_key', sigData.apiKey);
            uploadData.append('folder', sigData.folder);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/${sigData.resourceType}/upload`, {
                method: 'POST',
                body: uploadData
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setFormData(prev => ({ ...prev, [field]: data.secure_url }));
            toast.success('Image uploaded');
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.beforeImage || !formData.afterImage) {
            toast.error('Both images are required');
            return;
        }

        setLoading(true);
        const result = editingId
            ? await updateTransformation(editingId, formData)
            : await createTransformation(formData);

        if (result.success) {
            toast.success(editingId ? 'Transformation updated' : 'Transformation created');
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                beforeImage: '',
                afterImage: '',
                caption: '',
                durationUsed: '',
                productId: products[0]?.id || '',
                isFeatured: false
            });
        } else {
            toast.error(result.error || 'Operation failed');
        }
        setLoading(false);
    };

    const handleEdit = (t: Transformation) => {
        setEditingId(t.id);
        setFormData({
            beforeImage: t.beforeImage,
            afterImage: t.afterImage,
            caption: t.caption || '',
            durationUsed: t.durationUsed || '',
            productId: t.productId,
            isFeatured: t.isFeatured
        });
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoading(true);
        const result = await deleteTransformation(deleteId);
        if (result.success) {
            toast.success('Deleted successfully');
            setDeleteId(null);
        } else {
            toast.error('Delete failed');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-serif font-bold text-stone-900">Transformations</h1>
                    <p className="text-stone-500 text-sm italic">Manage the visual proof of Luxe Moon excellence.</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> NEW ENTRY
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {transformations.map(t => (
                    <div key={t.id} className="bg-white rounded-[32px] overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                        <div className="px-2 pt-2 flex gap-1 h-64">
                            <div className="relative flex-1 rounded-2xl overflow-hidden bg-stone-50">
                                <Image src={optimizeImage(t.beforeImage)} alt="Before" fill className="object-cover" />
                                <div className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">Before</div>
                            </div>
                            <div className="relative flex-1 rounded-2xl overflow-hidden bg-stone-50">
                                <Image src={optimizeImage(t.afterImage)} alt="After" fill className="object-cover" />
                                <div className="absolute top-2 right-2 bg-amber-500/90 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">After</div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2 text-xs">
                                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{t.product.name}</span>
                                {t.isFeatured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                            </div>
                            <h3 className="font-bold text-stone-900 line-clamp-1 mb-1">{t.caption || "Amazing Transformation"}</h3>
                            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                                {t.durationUsed ? `Duration: ${t.durationUsed}` : 'Verified Result'}
                            </p>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(t)} className="flex-1 py-2 text-xs font-bold text-stone-600 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors flex items-center justify-center gap-1">
                                    <Edit className="w-3.5 h-3.5" /> EDIT
                                </button>
                                <button onClick={() => setDeleteId(t.id)} className="w-10 h-10 flex items-center justify-center text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-[24px] md:rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        {/* Fixed Header */}
                        <div className="flex-none px-6 py-6 md:px-8 border-b border-stone-100 flex items-center justify-between bg-white z-10">
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">{editingId ? 'Refine Result' : 'Publish Result'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-900 bg-stone-50 md:bg-transparent">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6 md:p-8">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Before Evidence <span className="text-red-400">*</span></label>
                                            <div className="relative aspect-[3/4] rounded-[32px] border-2 border-dashed border-stone-200 overflow-hidden bg-stone-50/80 group hover:border-amber-300 transition-colors shadow-sm">
                                                {formData.beforeImage ? (
                                                    <Image src={optimizeImage(formData.beforeImage)} alt="" fill className="object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300 group-hover:text-amber-500 transition-colors gap-3 cursor-pointer">
                                                        <Upload className="w-8 h-8" />
                                                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Upload Image</span>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" onChange={e => handleUpload(e, 'beforeImage')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">After Evidence <span className="text-red-400">*</span></label>
                                            <div className="relative aspect-[3/4] rounded-[32px] border-2 border-dashed border-stone-200 overflow-hidden bg-stone-50/80 group hover:border-amber-300 transition-colors shadow-sm">
                                                {formData.afterImage ? (
                                                    <Image src={optimizeImage(formData.afterImage)} alt="" fill className="object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300 group-hover:text-amber-500 transition-colors gap-3 cursor-pointer">
                                                        <Upload className="w-8 h-8" />
                                                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Upload Image</span>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" onChange={e => handleUpload(e, 'afterImage')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">Associated Product</label>
                                            <select
                                                className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-200"
                                                value={formData.productId}
                                                onChange={e => setFormData({ ...formData, productId: e.target.value })}
                                            >
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">Duration (Optional)</label>
                                            <input
                                                className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-amber-200"
                                                placeholder="e.g. 4 Weeks"
                                                value={formData.durationUsed}
                                                onChange={e => setFormData({ ...formData, durationUsed: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">Compelling Caption</label>
                                        <textarea
                                            className="w-full bg-stone-50 border-none rounded-3xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-amber-200 resize-none"
                                            placeholder="Briefly describe the incredible change..."
                                            rows={3}
                                            value={formData.caption}
                                            onChange={e => setFormData({ ...formData, caption: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                                        <input
                                            type="checkbox"
                                            id="isFeatured"
                                            className="w-5 h-5 rounded-lg border-stone-300 text-amber-600 focus:ring-amber-200"
                                            checked={formData.isFeatured}
                                            onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                                        />
                                        <label htmlFor="isFeatured" className="text-sm font-bold text-stone-700">Display this result on homepage highlights</label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || uploading}
                                        className="w-full py-5 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 disabled:opacity-50 transition-all shadow-2xl shadow-stone-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                PROCESSING...
                                            </>
                                        ) : uploading ? (
                                            'UPLOADING EVIDENCE...'
                                        ) : (
                                            'PUBLISH TRANSFORMATION'
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={!!deleteId}
                title="Erase Result"
                message="This transformation proof will be permanently removed from all displays. This action is irreversible."
                variant="danger"
                confirmLabel="Yes, Erase Proof"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
