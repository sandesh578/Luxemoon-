'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createCategory } from '../../actions';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function NewCategory() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<string[]>([]);
    const [form, setForm] = useState({
        name: '',
        slug: '',
        description: '',
    });

    const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await createCategory({
            ...form,
            image: image[0] || null,
        });

        if (result.success) {
            toast.success('Category created!');
            router.push('/admin/categories');
        } else {
            toast.error(result.error || 'Failed to create category');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">New Category</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-stone-600 mb-1">Category Name *</label>
                        <input
                            required
                            className="w-full p-2 border rounded-lg"
                            value={form.name}
                            onChange={e => {
                                set('name', e.target.value);
                                // Auto-generate slug if it's currently empty or strictly following name
                                if (!form.slug || form.slug === form.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')) {
                                    set('slug', e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                                }
                            }}
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
                            placeholder="A brief summary for the category page."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-stone-600 mb-1">Banner Image</label>
                        <ImageUpload images={image} onChange={setImage} maxImages={1} />
                        <p className="text-xs text-stone-400 mt-1">Used as a banner on the category collection page.</p>
                    </div>
                </div>

                <button
                    disabled={loading}
                    className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-stone-800 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Create Category'}
                </button>
            </form>
        </div>
    );
}
