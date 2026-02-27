'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Folder } from 'lucide-react';
import { toast } from 'sonner';
import { deleteCategory } from '../actions';
import Image from 'next/image';
import { optimizeImage } from '@/lib/image';

interface Category {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    description: string | null;
    _count?: {
        products: number;
    };
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        const res = await deleteCategory(id);
        if (res.success) {
            toast.success('Category deleted');
            fetchCategories();
        } else {
            toast.error(res.error || 'Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-stone-900">Categories</h1>
                    <p className="text-stone-500 text-sm">Manage product categories and banners</p>
                </div>
                <Link
                    href="/admin/categories/new"
                    className="bg-stone-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-stone-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Category
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-stone-200">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Image</th>
                            <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Slug</th>
                            <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Description</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-stone-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-stone-400">Loading categories...</td>
                            </tr>
                        ) : categories.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-stone-400">No categories found</td>
                            </tr>
                        ) : (
                            categories.map((category) => (
                                <tr key={category.id} className="hover:bg-stone-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-stone-600">
                                        {category.image ? (
                                            <Image src={optimizeImage(category.image)} alt={category.name} width={40} height={40} className="w-10 h-10 rounded object-cover border border-stone-200" />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-stone-100 flex items-center justify-center text-stone-400">
                                                <Folder className="w-5 h-5" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-stone-900">{category.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-stone-500">{category.slug}</td>
                                    <td className="px-6 py-4 text-sm text-stone-500 max-w-xs truncate">
                                        {category.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/admin/categories/${category.id}`}
                                                className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
