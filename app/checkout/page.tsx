'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useCart, useLocationContext, useConfig } from '@/components/Providers';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronDown, MapPin, Truck, Clock, CreditCard } from 'lucide-react';
import { NEPAL_PROVINCES, getDistrictsForProvince, isValleyDistrict } from '@/lib/nepal-data';
import Image from 'next/image';
import { optimizeImage } from '@/lib/image';

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const { isInsideValley, setInsideValley } = useLocationContext();
  const config = useConfig();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const [form, setForm] = useState({
    customerName: '', phone: '', email: '', province: '', district: '',
    address: '', landmark: '', notes: '', website: '',
  });

  const districts = useMemo(() => getDistrictsForProvince(form.province), [form.province]);

  // Auto-detect valley when district changes
  useEffect(() => {
    if (form.district) {
      setInsideValley(isValleyDistrict(form.district));
    }
  }, [form.district, setInsideValley]);

  // Auto-clear district when province changes
  useEffect(() => {
    const currentDistricts = getDistrictsForProvince(form.province);
    if (form.district && !currentDistricts.includes(form.district)) {
      setForm(prev => ({ ...prev, district: '' }));
    }
  }, [form.province, form.district]);


  const codFee = config.codFee || 0;

  const totalDiscount = items.reduce((acc, item) => {
    const currentPrice = isInsideValley ? item.priceInside : item.priceOutside;
    const original = (item as any).originalPrice || currentPrice;
    if (original > currentPrice) return acc + (original - currentPrice) * item.quantity;
    return acc;
  }, 0);
  const subtotal = cartTotal + totalDiscount;

  // Coupon Calculation
  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'FIXED') {
      couponDiscountAmount = appliedCoupon.discountValue;
    } else if (appliedCoupon.discountType === 'PERCENTAGE') {
      couponDiscountAmount = Math.floor(subtotal * (appliedCoupon.discountValue / 100));
    }
    if (appliedCoupon.maxDiscountCap && couponDiscountAmount > appliedCoupon.maxDiscountCap) {
      couponDiscountAmount = appliedCoupon.maxDiscountCap;
    }
  }

  const deliveryCharge = (subtotal - couponDiscountAmount) >= config.freeDeliveryThreshold
    ? 0
    : (isInsideValley ? config.deliveryChargeInside : config.deliveryChargeOutside);

  const estimatedDelivery = isInsideValley ? config.estimatedDeliveryInside : config.estimatedDeliveryOutside;

  const finalTotal = subtotal - couponDiscountAmount + deliveryCharge + codFee;

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    setAppliedCoupon(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal,
          itemIds: items.map(i => i.id)
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid coupon');

      setAppliedCoupon(data);
      setCouponSuccess('Coupon applied successfully!');
    } catch (err: any) {
      setCouponError(err.message);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          isInsideValley,
          items: items.map(i => ({
            productId: i.id,
            quantity: i.quantity,
            price: isInsideValley ? i.priceInside : i.priceOutside,
          })),
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      clearCart();
      router.push(`/order-confirmation/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center min-h-screen">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-4">Your bag is empty</h1>
        <a href="/shop" className="text-amber-700 font-bold hover:underline">Continue Shopping</a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-screen">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-4">
              <h2 className="text-lg font-bold text-stone-800">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">Full Name *</label>
                  <input required className="w-full p-2.5 border border-stone-200 rounded-lg" value={form.customerName} onChange={e => set('customerName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">Phone *</label>
                  <input required type="tel" className="w-full p-2.5 border border-stone-200 rounded-lg" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="98XXXXXXXX" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">Email (optional)</label>
                <input type="email" pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$" title="Please enter a valid email address" className="w-full p-2.5 border border-stone-200 rounded-lg" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" />
              </div>
              <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" value={form.website} onChange={e => set('website', e.target.value)} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-4">
              <h2 className="text-lg font-bold text-stone-800">Delivery Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-bold text-stone-600 mb-1">Province *</label>
                  <select
                    required
                    className="w-full p-2.5 border border-stone-200 rounded-lg appearance-none bg-white pr-8"
                    value={form.province}
                    onChange={e => set('province', e.target.value)}
                  >
                    <option value="">Select Province</option>
                    {Object.keys(NEPAL_PROVINCES).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <label className="block text-sm font-bold text-stone-600 mb-1">District *</label>
                  <select
                    required
                    disabled={!form.province}
                    className="w-full p-2.5 border border-stone-200 rounded-lg appearance-none bg-white pr-8 disabled:bg-stone-50 disabled:text-stone-400"
                    value={form.district}
                    onChange={e => set('district', e.target.value)}
                  >
                    <option value="">{form.province ? 'Select District' : 'Select province first'}</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {form.district && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">
                    {isInsideValley ? 'Kathmandu Valley' : 'Outside Valley'} — delivery: {estimatedDelivery}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">Full Address *</label>
                <input required className="w-full p-2.5 border border-stone-200 rounded-lg" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, house number, area" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">Landmark</label>
                  <input className="w-full p-2.5 border border-stone-200 rounded-lg" value={form.landmark} onChange={e => set('landmark', e.target.value)} placeholder="Near..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">Order Notes</label>
                  <input className="w-full p-2.5 border border-stone-200 rounded-lg" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any special instructions" />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 sticky top-24 space-y-4">
            <h2 className="text-lg font-bold text-stone-800">Order Summary</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                    <Image src={optimizeImage(item.images[0])} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-900 truncate">{item.name}</p>
                    <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-stone-800 whitespace-nowrap">
                    NPR {((isInsideValley ? item.priceInside : item.priceOutside) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-200 pt-4 space-y-4">

              {/* Coupon Input Area */}
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider">Promo Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={appliedCoupon !== null}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-stone-100 disabled:text-stone-500 uppercase"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-4 py-2 bg-stone-200 text-stone-700 text-sm font-bold rounded-md hover:bg-stone-300 transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="px-4 py-2 bg-stone-900 text-white text-sm font-bold rounded-md hover:bg-stone-800 transition-colors disabled:opacity-50"
                    >
                      {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </button>
                  )}
                </div>
                {couponError && <p className="text-xs text-red-600 font-medium mt-2">{couponError}</p>}
                {couponSuccess && <p className="text-xs text-green-600 font-medium mt-2">{couponSuccess}</p>}
              </div>

            </div>

            <div className="border-t border-stone-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Items Total</span>
                <span className="font-bold">NPR {subtotal.toLocaleString()}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">Bulk/Promo Savings</span>
                  <span className="font-bold">- NPR {totalDiscount.toLocaleString()}</span>
                </div>
              )}
              {couponDiscountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">Coupon ({appliedCoupon?.code})</span>
                  <span className="font-bold">- NPR {couponDiscountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Delivery Charge</span>
                <span className="font-bold">
                  {deliveryCharge === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `NPR ${deliveryCharge.toLocaleString()}`
                  )}
                </span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-500 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> COD Fee</span>
                  <span className="font-bold">NPR {codFee}</span>
                </div>
              )}
              {form.district && (
                <div className="flex justify-between text-xs text-stone-400 items-center gap-1">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Est. delivery</span>
                  <span>{estimatedDelivery}</span>
                </div>
              )}
              <div className="flex justify-between text-lg pt-2 border-t border-stone-200">
                <span className="font-bold text-stone-900">Final Total</span>
                <span className="font-bold text-stone-900">NPR {finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="w-full py-3.5 bg-stone-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-stone-800 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Place Order (Cash on Delivery)'}
            </button>
            <p className="text-[10px] text-center text-stone-400">By placing your order, you agree to our terms & conditions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
