'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AlertCircle, Clock, CreditCard, Loader2, Truck } from 'lucide-react';
import { optimizeImage } from '@/lib/image';
import { useConfig } from '@/components/Providers';
import { formatCurrency } from '@/lib/currency';
import { calculateDiscountedPrice } from '@/lib/settings';

type CheckoutItem = {
  id: string;
  name: string;
  images: string[];
  quantity: number;
  priceInside: number;
  priceOutside: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  discountFixed?: number | null;
  discountStart?: string | null;
  discountEnd?: string | null;
};

type AppliedCoupon = {
  code: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  maxDiscountCap?: number | null;
};

type Copy = {
  summary: string;
  qty: string;
  promoCode: string;
  enterCode: string;
  remove: string;
  apply: string;
  itemsTotal: string;
  savings: string;
  coupon: string;
  deliveryCharge: string;
  free: string;
  codFee: string;
  estDelivery: string;
  finalTotal: string;
  almostThereTitle: string;
  almostThereBody: string;
  placeOrder: string;
  thanks: string;
  termsNote: string;
};

type Props = {
  items: CheckoutItem[];
  isInsideValley: boolean;
  freeDeliveryThreshold: number;
  deliveryChargeInside: number;
  deliveryChargeOutside: number;
  codFee: number;
  estimatedDelivery: string;
  formDistrict: string;
  copy: Copy;
  loading: boolean;
  error: string;
  showValidationSummary: boolean;
  onCouponCodeChange: (value?: string) => void;
};

export default function CheckoutSummary({
  items,
  isInsideValley,
  freeDeliveryThreshold,
  deliveryChargeInside,
  deliveryChargeOutside,
  codFee,
  estimatedDelivery,
  formDistrict,
  copy,
  loading,
  error,
  showValidationSummary,
  onCouponCodeChange,
}: Props) {
  const config = useConfig();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const subtotal = useMemo(() => {
    return items.reduce((accumulator, item) => {
        const basePrice = isInsideValley ? (Number(item.priceInside) || 0) : (Number(item.priceOutside) || 0);
        const unitPrice = calculateDiscountedPrice(basePrice, item as any, config as any);
        return accumulator + (unitPrice * item.quantity);
    }, 0);
  }, [isInsideValley, items, config]);

  const totalDiscount = useMemo(() => {
    return items.reduce((accumulator, item) => {
      const basePrice = isInsideValley ? (Number(item.priceInside) || 0) : (Number(item.priceOutside) || 0);
      const unitPrice = calculateDiscountedPrice(basePrice, item as any, config as any);
      const originalPrice = Number(item.originalPrice) || basePrice;
      
      // The discount is the difference between what they WOULD have paid (original) 
      // vs what they are actually paying (unitPrice)
      if (originalPrice > unitPrice) {
        return accumulator + (originalPrice - unitPrice) * item.quantity;
      }
      return accumulator;
    }, 0);
  }, [isInsideValley, items, config]);

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;

    let amount = 0;
    if (appliedCoupon.discountType === 'FIXED') amount = appliedCoupon.discountValue;
    if (appliedCoupon.discountType === 'PERCENTAGE') amount = Math.floor(subtotal * (appliedCoupon.discountValue / 100));
    if (appliedCoupon.maxDiscountCap && amount > appliedCoupon.maxDiscountCap) amount = appliedCoupon.maxDiscountCap;
    return amount;
  }, [appliedCoupon, subtotal]);

  const deliveryCharge = useMemo(() => {
    if ((subtotal - couponDiscountAmount) >= freeDeliveryThreshold) return 0;
    return isInsideValley ? deliveryChargeInside : deliveryChargeOutside;
  }, [couponDiscountAmount, deliveryChargeInside, deliveryChargeOutside, freeDeliveryThreshold, isInsideValley, subtotal]);

  const finalTotal = subtotal - couponDiscountAmount + deliveryCharge + codFee;
  const formatPrice = (amount: number) => formatCurrency(amount, config.currencyCode);

  useEffect(() => {
    onCouponCodeChange(appliedCoupon?.code);
  }, [appliedCoupon, onCouponCodeChange]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    setAppliedCoupon(null);

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal,
          itemIds: items.map((item) => item.id),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid coupon');

      setAppliedCoupon(data);
      setCouponSuccess('Coupon applied successfully!');
    } catch (requestError) {
      setCouponError(requestError instanceof Error ? requestError.message : 'Invalid coupon');
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

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 sticky top-24 space-y-4">
      <h2 className="text-lg font-bold text-stone-800">{copy.summary}</h2>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 text-sm">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
              <Image src={optimizeImage(item.images[0])} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-stone-900 truncate">{item.name}</p>
              <p className="text-xs text-stone-500">{copy.qty}: {item.quantity}</p>
            </div>
            <span className="font-bold text-stone-800 whitespace-nowrap">
              {formatPrice(((isInsideValley ? (Number(item.priceInside) || 0) : (Number(item.priceOutside) || 0))) * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-stone-200 pt-4 space-y-4">
        <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
          <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider">{copy.promoCode}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              disabled={appliedCoupon !== null}
              placeholder={copy.enterCode}
              className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-stone-100 disabled:text-stone-500 uppercase"
            />
            {appliedCoupon ? (
              <button type="button" onClick={handleRemoveCoupon} className="px-4 py-2 bg-stone-200 text-stone-700 text-sm font-bold rounded-md hover:bg-stone-300 transition-colors">
                {copy.remove}
              </button>
            ) : (
              <button type="button" onClick={handleApplyCoupon} disabled={validatingCoupon || !couponCode.trim()} className="px-4 py-2 bg-stone-900 text-white text-sm font-bold rounded-md hover:bg-stone-800 transition-colors disabled:opacity-50">
                {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : copy.apply}
              </button>
            )}
          </div>
          {couponError && <p className="text-xs text-red-600 font-medium mt-2">{couponError}</p>}
          {couponSuccess && <p className="text-xs text-green-600 font-medium mt-2">{couponSuccess}</p>}
        </div>
      </div>

      <div className="border-t border-stone-200 pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-500">{copy.itemsTotal}</span>
          <span className="font-bold">{formatPrice(subtotal)}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="flex justify-between text-green-700 bg-green-50 border border-green-100 rounded-lg px-2 py-1">
            <span className="flex items-center gap-1">{copy.savings}</span>
            <span className="font-bold">- {formatPrice(totalDiscount)}</span>
          </div>
        )}
        {couponDiscountAmount > 0 && (
          <div className="flex justify-between text-green-700 bg-green-50 border border-green-100 rounded-lg px-2 py-1">
            <span className="flex items-center gap-1">{copy.coupon} ({appliedCoupon?.code})</span>
            <span className="font-bold">- {formatPrice(couponDiscountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-1">
          <span className="text-stone-500 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {copy.deliveryCharge}</span>
          <span className="font-bold">
            {deliveryCharge === 0 ? <span className="text-green-600">{copy.free}</span> : formatPrice(deliveryCharge)}
          </span>
        </div>
        {codFee > 0 && (
          <div className="flex justify-between">
            <span className="text-stone-500 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> {copy.codFee}</span>
            <span className="font-bold">{formatPrice(codFee)}</span>
          </div>
        )}
        {formDistrict && (
          <div className="flex justify-between text-xs text-stone-400 items-center gap-1">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {copy.estDelivery}</span>
            <span>{estimatedDelivery}</span>
          </div>
        )}
        <div className="flex justify-between text-lg pt-2 border-t border-stone-200">
          <span className="font-bold text-stone-900">{copy.finalTotal}</span>
          <span className="font-extrabold text-stone-900 text-xl">{formatPrice(finalTotal)}</span>
        </div>
      </div>

      {showValidationSummary && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FDECEC] text-red-700 border border-red-100 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">{copy.almostThereTitle}</p>
            <p>{copy.almostThereBody}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FDECEC] text-red-700 border border-red-100 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <button
        type="submit"
        form="checkout-form"
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-[#5C3A21] to-[#C7782A] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : copy.placeOrder}
      </button>
      <p className="text-[11px] text-center text-stone-500">{copy.thanks}</p>
      <p className="text-[10px] text-center text-stone-400">{copy.termsNote}</p>
    </div>
  );
}
