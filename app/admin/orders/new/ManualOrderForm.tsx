'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminOrder } from '@/app/admin/actions';
import { Plus, Minus, Trash2, Loader2, Navigation2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useConfig } from '@/components/Providers';
import { formatCurrency } from '@/lib/currency';

interface ProductMin {
    id: string;
    name: string;
    priceInside: number;
    priceOutside: number;
    stock: number;
    images: string[];
}

export default function ManualOrderForm({ products }: { products: ProductMin[] }) {
    const router = useRouter();
    const config = useConfig();
    const formatPrice = (amount: number) => formatCurrency(amount, config.currencyCode);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        customerName: '',
        phone: '',
        email: '',
        address: '',
        province: '',
        district: '',
        landmark: '',
        notes: '',
    });

    const [isInsideValley, setIsInsideValley] = useState(true);
    const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([]);

    const handleAddItem = (productId: string) => {
        if (!productId) return;
        setOrderItems(prev => {
            const existing = prev.find(i => i.productId === productId);
            if (existing) {
                return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { productId, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setOrderItems(prev => prev.map(i => {
            if (i.productId === productId) {
                return { ...i, quantity: Math.max(1, i.quantity + delta) };
            }
            return i;
        }));
    };

    const removeItem = (productId: string) => {
        setOrderItems(prev => prev.filter(i => i.productId !== productId));
    };

    const calculateSubtotal = () => {
        return orderItems.reduce((acc, item) => {
            const p = products.find(prod => prod.id === item.productId);
            if (!p) return acc;
            const price = isInsideValley ? p.priceInside : p.priceOutside;
            return acc + (price * item.quantity);
        }, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (orderItems.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setLoading(true);
        try {
            const res = await createAdminOrder({
                ...form,
                isInsideValley,
                items: orderItems
            });

            if (res.success) {
                toast.success('Order created successfully');
                router.push('/admin');
                router.refresh();
            } else {
                toast.error(res.error || 'Failed to create order');
            }
        } catch (err) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 content-auto">
            {/* Customer Info */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-stone-200">
                    <h2 className="text-xl font-bold text-stone-900 mb-4">Customer Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">Full Name *</label>
                            <input required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">Phone *</label>
                            <input required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^\d]/g, '') })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-stone-700 mb-1">Address *</label>
                            <input required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">Province</label>
                            <input className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">District</label>
                            <input className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">Email (Optional)</label>
                            <input type="email" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">Landmark (Optional)</label>
                            <input className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-stone-200">
                    <h2 className="text-xl font-bold text-stone-900 mb-4">Delivery Zone</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setIsInsideValley(true)}
                            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-colors ${isInsideValley ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:border-amber-200'
                                }`}
                        >
                            <Truck className={`w-5 h-5 mt-0.5 ${isInsideValley ? 'text-amber-600' : 'text-stone-400'}`} />
                            <div>
                                <div className="font-bold text-stone-900">Inside Valley</div>
                                <div className="text-sm text-stone-500">Kathmandu, Bhaktapur, Lalitpur</div>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsInsideValley(false)}
                            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-colors ${!isInsideValley ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:border-amber-200'
                                }`}
                        >
                            <Navigation2 className={`w-5 h-5 mt-0.5 ${!isInsideValley ? 'text-amber-600' : 'text-stone-400'}`} />
                            <div>
                                <div className="font-bold text-stone-900">Outside Valley</div>
                                <div className="text-sm text-stone-500">Other districts in Nepal</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Order Items & Summary */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-stone-200">
                    <h2 className="text-xl font-bold text-stone-900 mb-4">Order Items</h2>

                    <div className="mb-6">
                        <select
                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-stone-50"
                            onChange={(e) => {
                                handleAddItem(e.target.value);
                                e.target.value = '';
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>+ Add Product</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} - {formatPrice(isInsideValley ? p.priceInside : p.priceOutside)} ({p.stock} in stock)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        {orderItems.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            if (!product) return null;

                            const price = isInsideValley ? product.priceInside : product.priceOutside;

                            return (
                                <div key={item.productId} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
                                    {product.images?.[0] && (
                                        <div className="relative w-12 h-12 rounded-md overflow-hidden">
                                            <Image src={product.images[0]} alt={product.name} fill sizes="48px" className="object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-stone-900 truncate">{product.name}</div>
                                        <div className="text-xs text-stone-500">{formatPrice(price)}</div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white rounded-lg border border-stone-200 p-1">
                                        <button type="button" onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:bg-stone-50 rounded">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                        <button type="button" onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:bg-stone-50 rounded">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <button type="button" onClick={() => removeItem(item.productId)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}

                        {orderItems.length === 0 && (
                            <div className="text-center py-6 text-sm text-stone-500 border-2 border-dashed border-stone-200 rounded-lg">
                                No items added yet
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-stone-900 p-6 rounded-xl text-white">
                    <h2 className="text-lg font-bold mb-4">Summary</h2>
                    <div className="space-y-2 text-sm text-stone-400">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="text-white">{formatPrice(calculateSubtotal())}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Delivery (Auto-calculated)</span>
                            <span className="text-white">Applied on Save</span>
                        </div>
                    </div>
                    <div className="border-t border-stone-700 my-4"></div>
                    <button
                        type="submit"
                        disabled={loading || orderItems.length === 0}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Order'}
                    </button>
                </div>
            </div>
        </form>
    );
}
