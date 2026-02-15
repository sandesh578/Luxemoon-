'use client';
import React, { useState, useEffect } from 'react';
import { useCart, useLocationContext, useConfig } from '@/components/Providers';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PROVINCES } from '@/lib/constants';

export default function CheckoutPage() {
  const { items, cartTotal, deliveryCharge, finalTotal, clearCart } = useCart();
  const { isInsideValley, setInsideValley } = useLocationContext();
  const config = useConfig();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    province: '',
    district: '',
    address: '',
    landmark: '',
    notes: ''
  });

  useEffect(() => {
    setIdempotencyKey(Math.random().toString(36).substring(2) + Date.now().toString(36));
  }, []);

  if (items.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <ShoppingBag className="w-16 h-16 text-stone-300 mb-4" />
      <h2 className="font-serif text-2xl font-bold mb-4">Your cart is empty</h2>
      <Link href="/shop" className="px-6 py-3 bg-stone-900 text-white rounded-xl">Start Shopping</Link>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isInsideValley,
          idempotencyKey,
          items: items.map(i => ({
            productId: i.id,
            quantity: i.quantity,
            price: isInsideValley ? i.priceInside : i.priceOutside
          })),
          // Total calculated on server, but sending for validation/logs if needed
          total: finalTotal 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      clearCart();
      router.push(`/order-confirmation/${data.id}`);
    } catch (err: any) {
      alert(err.message || 'Error placing order. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12">Secure Checkout</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-100">
            <h2 className="font-serif text-xl font-bold mb-6">1. Shipping Details</h2>
            
            <div className="mb-6 bg-amber-50/50 p-4 rounded-xl border border-amber-100 cursor-pointer" onClick={() => setInsideValley(!isInsideValley)}>
              <div className="flex items-center gap-3 select-none">
                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isInsideValley ? 'bg-amber-600' : 'bg-stone-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isInsideValley ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <span className="font-bold text-stone-800">I am inside Kathmandu Valley</span>
              </div>
            </div>

            <div className="space-y-4">
               <input 
                 className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                 placeholder="Full Name"
                 value={formData.customerName}
                 onChange={e => setFormData({...formData, customerName: e.target.value})}
                 required
                 disabled={loading}
               />
               <input 
                 className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                 placeholder="Phone Number (10 digits)"
                 value={formData.phone}
                 onChange={e => setFormData({...formData, phone: e.target.value})}
                 required
                 pattern="[0-9]{10}"
                 disabled={loading}
               />
               <div className="grid grid-cols-2 gap-4">
                 <select 
                   className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                   value={formData.province}
                   onChange={e => setFormData({...formData, province: e.target.value})}
                   required
                   disabled={loading}
                 >
                    <option value="">Select Province</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
                 <input 
                   className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                   placeholder="District"
                   value={formData.district}
                   onChange={e => setFormData({...formData, district: e.target.value})}
                   required
                   disabled={loading}
                 />
               </div>
               <input 
                 className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                 placeholder="Street Address / Area"
                 value={formData.address}
                 onChange={e => setFormData({...formData, address: e.target.value})}
                 required
                 disabled={loading}
               />
               <input 
                 className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                 placeholder="Landmark (Optional)"
                 value={formData.landmark}
                 onChange={e => setFormData({...formData, landmark: e.target.value})}
                 disabled={loading}
               />
               <textarea 
                 className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:border-amber-500 outline-none"
                 placeholder="Delivery Notes (Optional)"
                 value={formData.notes}
                 onChange={e => setFormData({...formData, notes: e.target.value})}
                 disabled={loading}
                 rows={3}
               />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
           <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-stone-100 sticky top-24">
              <h2 className="font-serif text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.images[0]} className="w-16 h-16 rounded-lg bg-stone-100 object-cover" />
                    <div>
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-amber-700">NPR {((isInsideValley ? item.priceInside : item.priceOutside) * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Subtotal</span>
                  <span>NPR {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Delivery ({isInsideValley ? 'Inside Valley' : 'Outside Valley'})</span>
                  <span>{deliveryCharge === 0 ? <span className="text-green-600 font-bold">FREE</span> : `NPR ${deliveryCharge}`}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 text-stone-900">
                  <span>Total</span>
                  <span className="text-amber-700">NPR {finalTotal.toLocaleString()}</span>
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full mt-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="animate-spin" /> PROCESSING...</> : 'CONFIRM ORDER (COD)'}
              </button>
            </div>
        </div>
      </form>
    </div>
  );
}
