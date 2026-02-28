'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateCategory, deleteCategory } from '../../actions';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function EditCategory() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [image, setImage] = useState<string[]>([]);
    const [form, setForm] = useState({
        name: '',
        slug: '',
        description: '',
        isActive: true,
        isArchived: false,
    });

    const fetchCategory = useCallback(async () => {
        try {
            const res = await fetch(`/api/categories/${id}`);

            if (res.ok) {
                const category = await res.json();
                setForm({
                    name: category.name,
                    slug: category.slug,
                    description: category.description || '',
                    isActive: category.isActive ?? true,
                    isArchived: category.isArchived ?? false,
                });
                if (category.image) setImage([category.image]);
            } else {
                toast.error('Category not found');
                router.push('/admin/categories');
            }
        } catch (error) {
            toast.error('Failed to load category');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchCategory();
    }, [fetchCategory]);

    const set = (key: string, value: string | boolean) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const result = await updateCategory(id, {
            ...form,
            image: image[0] || null,
        });

        if (result.success) {
            toast.success('Category updated!');
            router.push('/admin/categories');
        } else {
            toast.error(result.error || 'Failed to update category');
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this category? This action cannot be undone and will fail if products are still tied to it.')) return;
        setSaving(true);
        const res = await deleteCategory(id);
        if (res.success) {
            toast.success('Category deleted permanently');
            router.push('/admin/categories');
        } else {
            toast.error(res.error || 'Failed to delete category');
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading...</div>;

    return (
        <div className="max-w-2xl">
            <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">Edit Category</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-stone-600 mb-1">Category Name *</label>
                        <input
                            required
                            className="w-full p-2 border rounded-lg"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-stone-600 mb-1">Slug *</label>
                        <input
                            required
                            className="w-full p-2 border rounded-lg"
                            value={form.slug}
                            onChange={e => set('slug', e.target.value)}
                        />
                        <p className="text-xs text-stone-400 mt-1">Used for SEO-friendly URLs: /category/{"{slug}"}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-stone-600 mb-1">Description</label>
                        <textarea
                            className="w-full p-2 border rounded-lg"
                            rows={3}
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-stone-600 mb-1">Banner Image</label>
                        <ImageUpload images={image} onChange={setImage} maxImages={1} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mt-6 space-y-4">
                    <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">Status & Visibility</h2>
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-bold text-stone-600 group-hover:text-stone-900 transition-colors">Active (Visible to public)</span>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${form.isActive ? 'bg-amber-600' : 'bg-stone-200'}`}>
                            <input type="checkbox" className="sr-only" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
                        </div>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-bold text-stone-600 group-hover:text-stone-900 transition-colors">Archived (Soft Deleted)</span>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${form.isArchived ? 'bg-amber-600' : 'bg-stone-200'}`}>
                            <input type="checkbox" className="sr-only" checked={form.isArchived} onChange={e => set('isArchived', e.target.checked)} />
                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${form.isArchived ? 'translate-x-5' : ''}`} />
                        </div>
                    </label>
                    {form.isArchived && (
                        <div className="pt-4 mt-4 border-t border-stone-100">
                            <button type="button" onClick={handleDelete} disabled={saving} className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-colors disabled:opacity-50 text-sm">
                                Delete Category
                            </button>
                        </div>
                    )}
                </div>

                <div className="pt-6">
                    <button
                        disabled={saving}
                        className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-stone-800 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin w-5 h-5" /> : 'Update Category'}
                    </button>
                </div>
            </form>
        </div>
    );
}
