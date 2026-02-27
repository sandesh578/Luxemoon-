'use client';

import React, { useState } from 'react';
import {
    createCoupon, updateCoupon, toggleCouponActive,
    softDeleteCoupon, restoreCoupon, permanentDeleteCoupon,
    duplicateCoupon
} from '@/app/admin/actions';
import { Trash, Edit, Plus, Check, ChevronRight, X, Play, RotateCcw, AlertTriangle, Copy } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';

export default function AdminCouponsClient({ coupons: initialCoupons, products, categories }: { coupons: any[], products: any[], categories: any[] }) {
    const [coupons, setCoupons] = useState(initialCoupons);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED' | 'EXPIRED'>('ALL');

    const [form, setForm] = useState<any>({
        code: '', description: '', discountType: 'PERCENTAGE', discountValue: 0,
        appliesToAll: true, productIds: [], categoryIds: [],
        minOrderAmount: '', maxDiscountCap: '', usageLimit: '', perUserLimit: 1,
        startsAt: '', expiresAt: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const resetForm = () => {
        setForm({
            code: '', description: '', discountType: 'PERCENTAGE', discountValue: 0,
            appliesToAll: true, productIds: [], categoryIds: [],
            minOrderAmount: '', maxDiscountCap: '', usageLimit: '', perUserLimit: 1,
            startsAt: '', expiresAt: ''
        });
        setEditingId(null);
    };

    const openNew = () => { resetForm(); setIsModalOpen(true); };

    const openEdit = (c: any) => {
        setForm({
            code: c.code, description: c.description || '', discountType: c.discountType, discountValue: c.discountValue,
            appliesToAll: c.appliesToAll, productIds: c.productIds, categoryIds: c.categoryIds,
            minOrderAmount: c.minOrderAmount || '', maxDiscountCap: c.maxDiscountCap || '',
            usageLimit: c.usageLimit || '', perUserLimit: c.perUserLimit || 1,
            startsAt: c.startsAt ? new Date(c.startsAt).toISOString().slice(0, 16) : '',
            expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : ''
        });
        setEditingId(c.id);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                ...form,
                minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
                maxDiscountCap: form.maxDiscountCap ? Number(form.maxDiscountCap) : null,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
                startsAt: form.startsAt ? new Date(form.startsAt) : null,
                expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
            };

            if (editingId) {
                await updateCoupon(editingId, payload);
                toast.success("Coupon updated");
            } else {
                await createCoupon(payload);
                toast.success("Coupon created");
            }
            setIsModalOpen(false);
            window.location.reload();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (id: string, current: boolean) => {
        try { await toggleCouponActive(id, !current); setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !current } : c)); toast.success("Status updated"); }
        catch (e) { toast.error("Update failed"); }
    };

    const handleDuplicate = async (id: string) => {
        try { await duplicateCoupon(id); toast.success("Coupon duplicated"); window.location.reload(); }
        catch (e: any) { toast.error(e.message); }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        setIsLoading(true);
        try {
            if (deleteType === 'soft') await softDeleteCoupon(deleteId);
            else await permanentDeleteCoupon(deleteId);

            setCoupons(prev => deleteType === 'hard' ? prev.filter(c => c.id !== deleteId) : prev.map(c => c.id === deleteId ? { ...c, deletedAt: new Date().toISOString() } : c));
            toast.success("Coupon deleted");
        } catch (err: any) { toast.error(err.message); }
        finally { setDeleteId(null); setIsLoading(false); }
    };

    const handleRestore = async (id: string) => {
        try { await restoreCoupon(id); setCoupons(prev => prev.map(c => c.id === id ? { ...c, deletedAt: null } : c)); toast.success("Coupon restored"); }
        catch (e) { toast.error("Restore failed"); }
    }

    const filteredCoupons = coupons.filter(c => {
        if (filter === 'ACTIVE') return c.isActive && !c.deletedAt && (!c.expiresAt || new Date(c.expiresAt) > new Date());
        if (filter === 'ARCHIVED') return c.deletedAt !== null;
        if (filter === 'EXPIRED') return c.expiresAt && new Date(c.expiresAt) < new Date();
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-6 border-b border-stone-200">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 font-serif">Promo Codes</h1>
                    <p className="text-sm text-stone-500">Manage discounts and usage limits.</p>
                </div>
                <button onClick={openNew} className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-stone-800 transition-colors">
                    <Plus className="w-4 h-4" /> Create Coupon
                </button>
            </div>

            <div className="flex gap-2">
                {['ALL', 'ACTIVE', 'ARCHIVED', 'EXPIRED'].map(f => (
                    <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${filter === f ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}>
                        {f}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-stone-50 text-stone-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Discount</th>
                                <th className="px-6 py-4">Usage</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {filteredCoupons.map((c) => (
                                <tr key={c.id} className={`hover:bg-stone-50 transition-colors ${c.deletedAt ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4 font-bold text-stone-900 whitespace-nowrap">
                                        {c.code}
                                        {c.description && <div className="text-xs text-stone-400 font-normal">{c.description}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `NPR ${c.discountValue}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-stone-500">
                                        <span className="font-bold text-stone-700">{c.usageCount}</span>
                                        {c.usageLimit ? ` / ${c.usageLimit}` : ' (unlimited)'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.deletedAt ? (
                                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">Archived</span>
                                        ) : (
                                            <button onClick={() => handleToggle(c.id, c.isActive)} className={`text-xs font-bold px-2 py-0.5 rounded ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'}`}>
                                                {c.isActive ? 'Active' : 'Draft'}
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => handleDuplicate(c.id)} title="Duplicate" className="p-2 text-stone-400 hover:text-stone-900 transition-colors"><Copy className="w-4 h-4" /></button>
                                        <button onClick={() => openEdit(c)} className="p-2 text-stone-400 hover:text-amber-600 transition-colors"><Edit className="w-4 h-4" /></button>
                                        {c.deletedAt ? (
                                            <>
                                                <button onClick={() => handleRestore(c.id)} title="Restore" className="p-2 text-stone-400 hover:text-green-600 transition-colors"><RotateCcw className="w-4 h-4" /></button>
                                                <button onClick={() => { setDeleteId(c.id); setDeleteType('hard'); }} title="Permanent Delete" className="p-2 text-stone-400 hover:text-red-600 transition-colors"><Trash className="w-4 h-4" /></button>
                                            </>
                                        ) : (
                                            <button onClick={() => { setDeleteId(c.id); setDeleteType('soft'); }} title="Archive" className="p-2 text-stone-400 hover:text-red-600 transition-colors"><X className="w-4 h-4" /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-8">
                        <h2 className="text-2xl font-bold font-serif mb-6">{editingId ? 'Edit Coupon' : 'Create Coupon'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Code * (e.g. SUMMER20)</label>
                                    <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full p-2.5 border rounded-xl uppercase font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Internal Description</label>
                                    <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-2.5 border rounded-xl" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Discount Type *</label>
                                    <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className="w-full p-2.5 border rounded-xl bg-white">
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FIXED">Fixed Amount (NPR)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Value *</label>
                                    <input type="number" required min="1" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })} className="w-full p-2.5 border rounded-xl" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Starts At (Optional)</label>
                                    <input type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} className="w-full p-2.5 border rounded-xl text-stone-600" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Expires At (Optional)</label>
                                    <input type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="w-full p-2.5 border rounded-xl text-stone-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Min Order Amount (NPR)</label>
                                    <input type="number" min="0" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} className="w-full p-2.5 border rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Max Discount Cap (NPR) - Percentage Only</label>
                                    <input type="number" min="0" value={form.maxDiscountCap} onChange={e => setForm({ ...form, maxDiscountCap: e.target.value })} disabled={form.discountType === 'FIXED'} className="w-full p-2.5 border rounded-xl disabled:bg-stone-100 disabled:opacity-50" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Total Usage Limit</label>
                                    <input type="number" min="1" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited if empty" className="w-full p-2.5 border rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Applies to Entire Store?</label>
                                    <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer">
                                        <input type="checkbox" checked={form.appliesToAll} onChange={e => setForm({ ...form, appliesToAll: e.target.checked })} />
                                        <span className="font-bold">Yes, all products</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-stone-500 font-bold hover:bg-stone-100 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" disabled={isLoading} className="px-5 py-2.5 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50">
                                    {isLoading ? 'Saving...' : 'Save Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDeleteConfirm}
                title={deleteType === 'hard' ? "Permanently Delete Coupon" : "Archive Coupon"}
                message={deleteType === 'hard' ? "Are you sure? This cannot be undone and will permanently remove this record from the database." : "Are you sure? Archiving prevents future use but keeps the record for accounting."}
                // @ts-ignore
                isLoading={isLoading}
            />
        </div>
    );
}
