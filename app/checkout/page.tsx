'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCart, useLocationContext, useConfig, useI18n } from '@/components/Providers';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronDown, MapPin, Truck, Clock, CreditCard, AlertCircle, Navigation2, User, Phone, Mail } from 'lucide-react';
import { NEPAL_PROVINCES, getDistrictsForProvince, isValleyDistrict } from '@/lib/nepal-data';
import Image from 'next/image';
import { optimizeImage } from '@/lib/image';
import { z } from 'zod';

const CheckoutFormSchema = z.object({
  customerName: z.string().trim().min(1, 'Please enter your full name so we know who to deliver to.'),
  phone: z.string().trim().regex(/^9[78]\d{8}$/, 'Please enter a valid Nepali mobile number (98XXXXXXXX).'),
  address: z.string().trim().min(1, 'Kindly provide your delivery address.'),
  province: z.string().trim().min(1),
  district: z.string().trim().min(1),
  deliveryZone: z.enum(['inside', 'outside'], { message: 'Please select your delivery location.' }),
});

type CheckoutField = keyof z.infer<typeof CheckoutFormSchema>;
type AddressSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    state?: string;
    province?: string;
    county?: string;
    district?: string;
    city?: string;
    municipality?: string;
    town?: string;
    village?: string;
  };
};

function normalizePlaceText(value?: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/\b(province|district|metropolitan city|sub-metropolitan city|rural municipality|municipality)\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const { isInsideValley, setInsideValley } = useLocationContext();
  const config = useConfig();
  const { locale } = useI18n();
  const router = useRouter();

  const isNe = locale === 'ne';
  const copy = {
    checkout: isNe ? 'चेकआउट' : 'Checkout',
    contactInfo: isNe ? 'सम्पर्क जानकारी' : 'Contact Information',
    fullName: isNe ? 'पूरा नाम' : 'Full Name',
    phone: isNe ? 'फोन' : 'Phone',
    emailOptional: isNe ? 'इमेल (ऐच्छिक)' : 'Email (optional)',
    fullNamePlaceholder: isNe ? 'उदाहरण: सीता खड्का' : 'e.g. Aavya Sharma',
    phonePlaceholder: '98XXXXXXXX',
    emailPlaceholder: isNe ? 'तपाईंको इमेल' : 'your@email.com',
    deliveryAddress: isNe ? 'डेलिभरी ठेगाना' : 'Delivery Address',
    insideValley: isNe ? 'भ्याली भित्र' : 'Inside Valley',
    outsideValley: isNe ? 'भ्याली बाहिर' : 'Outside Valley',
    insideDesc: isNe ? 'छिटो शहर डेलिभरी' : 'Fast city delivery with priority routing.',
    outsideDesc: isNe ? 'देशभरि डेलिभरी सेवा' : 'Nationwide delivery with trusted courier partners.',
    province: isNe ? 'प्रदेश' : 'Province',
    district: isNe ? 'जिल्ला' : 'District',
    selectProvince: isNe ? 'प्रदेश छान्नुहोस्' : 'Select Province',
    selectDistrict: isNe ? 'जिल्ला छान्नुहोस्' : 'Select District',
    selectProvinceFirst: isNe ? 'पहिले प्रदेश छान्नुहोस्' : 'Select province first',
    fullAddress: isNe ? 'पूरा ठेगाना' : 'Full Address',
    addressPlaceholder: isNe ? 'टोल, घर नम्बर, क्षेत्र' : 'Street, house number, area',
    addressHint: isNe ? 'क्षेत्र टाइप गर्न सुरु गर्नुहोस् (जस्तै: काठमाडौं, ललितपुर, पोखरा)' : 'Start typing your area (e.g., Kathmandu, Lalitpur, Pokhara)',
    locationSaved: isNe ? 'यो ठेगानाको लोकेशन सुरक्षित गरियो।' : 'Location pin saved for this address.',
    landmark: isNe ? 'ल्यान्डमार्क' : 'Landmark',
    notes: isNe ? 'अर्डर नोट' : 'Order Notes',
    nearPlaceholder: isNe ? 'नजिकै...' : 'Near...',
    specialInstructions: isNe ? 'विशेष निर्देशन' : 'Any special instructions',
    summary: isNe ? 'अर्डर सारांश' : 'Order Summary',
    qty: isNe ? 'परिमाण' : 'Qty',
    promoCode: isNe ? 'प्रोमो कोड' : 'Promo Code',
    enterCode: isNe ? 'कोड लेख्नुहोस्' : 'Enter code',
    remove: isNe ? 'हटाउनुहोस्' : 'Remove',
    apply: isNe ? 'लागु गर्नुहोस्' : 'Apply',
    itemsTotal: isNe ? 'सामान जम्मा' : 'Items Total',
    savings: isNe ? 'बचत' : 'Bulk/Promo Savings',
    coupon: isNe ? 'कुपन' : 'Coupon',
    deliveryCharge: isNe ? 'डेलिभरी शुल्क' : 'Delivery Charge',
    free: isNe ? 'निःशुल्क' : 'Free',
    codFee: isNe ? 'COD शुल्क' : 'COD Fee',
    estDelivery: isNe ? 'अनुमानित डेलिभरी' : 'Est. delivery',
    finalTotal: isNe ? 'अन्तिम कुल' : 'Final Total',
    almostThereTitle: isNe ? 'हामी लगभग पुगेका छौं।' : "We're almost there.",
    almostThereBody: isNe ? 'अर्डर पूरा गर्न हाइलाइट भएका विवरण जाँच गर्नुहोस्।' : 'Please review the highlighted fields to complete your order.',
    placeOrder: isNe ? 'अर्डर गर्नुहोस् (क्यास अन डेलिभरी)' : 'Place Order (Cash on Delivery)',
    thanks: isNe ? 'Luxe Moon छान्नु भएकोमा धन्यवाद।' : 'Thank you for choosing Luxe Moon.',
    termsNote: isNe ? 'अर्डर राखेर तपाईंले हाम्रो नियम तथा सर्तहरू स्वीकार गर्नुहुन्छ।' : 'By placing your order, you agree to our terms & conditions',
    emptyBag: isNe ? 'तपाईंको ब्याग खाली छ' : 'Your bag is empty',
    continueShopping: isNe ? 'किनमेल जारी राख्नुहोस्' : 'Continue Shopping',
    valleyText: isNe ? 'भ्याली भित्र' : 'Kathmandu Valley',
    outsideText: isNe ? 'भ्याली बाहिर' : 'Outside Valley',
    couldntFetchAddress: isNe ? 'अहिले सुझाव ल्याउन सकेनौं। कृपया ठेगाना हातैले लेख्नुहोस्।' : 'We couldnt fetch suggestions right now. Please enter your address manually.',
  } as const;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CheckoutField, string>>>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);

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
  const [deliveryZone, setDeliveryZone] = useState<'inside' | 'outside' | ''>('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressHintError, setAddressHintError] = useState('');
  const [selectedLatLon, setSelectedLatLon] = useState<{ lat: string; lon: string } | null>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const addressAbortRef = useRef<AbortController | null>(null);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressCacheRef = useRef<Map<string, AddressSuggestion[]>>(new Map());

  const districts = useMemo(() => getDistrictsForProvince(form.province), [form.province]);

  // Auto-detect valley when district changes
  useEffect(() => {
    if (form.district) {
      const inValley = isValleyDistrict(form.district);
      setInsideValley(inValley);
      setDeliveryZone(inValley ? 'inside' : 'outside');
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

  const setFieldError = (field: CheckoutField, message?: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  };

  const fallbackFieldMessage = (field: CheckoutField): string => {
    if (field === 'customerName') return isNe ? 'कृपया तपाईंको पूरा नाम लेख्नुहोस् ताकि हामी सही व्यक्तिलाई डेलिभरी गर्न सकौं।' : 'Please enter your full name so we know who to deliver to.';
    if (field === 'phone') return isNe ? 'कृपया मान्य नेपाली मोबाइल नम्बर लेख्नुहोस् (98XXXXXXXX)।' : 'Please enter a valid Nepali mobile number (98XXXXXXXX).';
    if (field === 'address') return isNe ? 'कृपया डेलिभरी ठेगाना लेख्नुहोस्।' : 'Kindly provide your delivery address.';
    if (field === 'deliveryZone') return isNe ? 'कृपया डेलिभरी स्थान छान्नुहोस्।' : 'Please select your delivery location.';
    if (field === 'province') return isNe ? 'कृपया प्रदेश छान्नुहोस्।' : 'Please select your province.';
    if (field === 'district') return isNe ? 'कृपया जिल्ला छान्नुहोस्।' : 'Please select your district.';
    return isNe ? 'कृपया यो विवरण जाँच गर्नुहोस्।' : 'Please check this field.';
  };

  const inferProvinceDistrict = (suggestion: AddressSuggestion): { province?: string; district?: string } => {
    const candidates = [
      suggestion.address?.state,
      suggestion.address?.province,
      suggestion.address?.county,
      suggestion.address?.district,
      suggestion.address?.city,
      suggestion.address?.municipality,
      suggestion.address?.town,
      suggestion.address?.village,
      ...suggestion.display_name.split(','),
    ]
      .map(normalizePlaceText)
      .filter(Boolean);

    let province: string | undefined;
    const provinces = Object.keys(NEPAL_PROVINCES);

    for (const p of provinces) {
      const pNorm = normalizePlaceText(p);
      if (candidates.some(c => c.includes(pNorm) || pNorm.includes(c))) {
        province = p;
        break;
      }
    }

    const districtPool = province
      ? NEPAL_PROVINCES[province]
      : provinces.flatMap(p => NEPAL_PROVINCES[p]);

    let district: string | undefined;
    for (const d of districtPool) {
      const dNorm = normalizePlaceText(d);
      if (candidates.some(c => c.includes(dNorm) || dNorm.includes(c))) {
        district = d;
        break;
      }
    }

    if (!province && district) {
      province = provinces.find(p => NEPAL_PROVINCES[p].includes(district));
    }

    return { province, district };
  };

  const validateField = (field: CheckoutField): boolean => {
    try {
      CheckoutFormSchema.pick({ [field]: true } as Record<CheckoutField, true>).parse({
        [field]: field === 'deliveryZone' ? deliveryZone : form[field as keyof typeof form]
      });
      setFieldError(field, undefined);
      return true;
    } catch (err) {
      setFieldError(field, fallbackFieldMessage(field));
      return false;
    }
  };

  const validateForm = (): boolean => {
    const parsed = CheckoutFormSchema.safeParse({
      customerName: form.customerName,
      phone: form.phone,
      address: form.address,
      province: form.province,
      district: form.district,
      deliveryZone,
    });

    if (parsed.success) {
      setFieldErrors({});
      setShowValidationSummary(false);
      return true;
    }

    const nextErrors: Partial<Record<CheckoutField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as CheckoutField;
      if (field && !nextErrors[field]) nextErrors[field] = fallbackFieldMessage(field);
    }
    setFieldErrors(nextErrors);
    setShowValidationSummary(true);
    return false;
  };

  const fetchAddressSuggestions = (query: string) => {
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    if (query.trim().length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      setIsAddressLoading(false);
      setAddressHintError('');
      return;
    }

    addressDebounceRef.current = setTimeout(async () => {
      const normalized = query.trim().toLowerCase();
      if (addressCacheRef.current.has(normalized)) {
        const cached = addressCacheRef.current.get(normalized) || [];
        setAddressSuggestions(cached);
        setShowSuggestions(cached.length > 0);
        setAddressHintError('');
        return;
      }

      addressAbortRef.current?.abort();
      const controller = new AbortController();
      addressAbortRef.current = controller;
      setIsAddressLoading(true);
      setAddressHintError('');

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=np&limit=5`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Address lookup failed');
        const data = (await res.json()) as AddressSuggestion[];
        addressCacheRef.current.set(normalized, data);
        setAddressSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setAddressHintError(copy.couldntFetchAddress);
          setAddressSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setIsAddressLoading(false);
      }
    }, 500);
  };

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
    if (loading) return;
    setError('');
    if (!validateForm()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          isInsideValley: deliveryZone === 'inside',
          items: items.map(i => ({
            productId: i.id,
            quantity: i.quantity,
            price: isInsideValley ? i.priceInside : i.priceOutside,
          })),
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (Array.isArray(data?.details)) {
          const nextErrors: Partial<Record<CheckoutField, string>> = {};
          data.details.forEach((d: { path?: string[]; message?: string }) => {
            const field = d?.path?.[0] as CheckoutField | undefined;
            if (field && d.message && !nextErrors[field]) nextErrors[field] = d.message;
          });
          if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(prev => ({ ...prev, ...nextErrors }));
            setShowValidationSummary(true);
          }
        }
        throw new Error(data.error || 'Just one more detail to complete your order.');
      }

      clearCart();
      router.push(`/order-confirmation/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Just one more detail to complete your order.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center min-h-screen">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-4">{copy.emptyBag}</h1>
        <a href="/shop" className="text-amber-700 font-bold hover:underline">{copy.continueShopping}</a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-screen">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">{copy.checkout}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-4">
              <h2 className="text-lg font-bold text-stone-800">{copy.contactInfo}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">{copy.fullName} *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input required className={`w-full p-2.5 pl-9 border rounded-lg ${fieldErrors.customerName ? 'border-red-300 bg-red-50/30' : 'border-stone-200'}`} value={form.customerName} onChange={e => { set('customerName', e.target.value); if (fieldErrors.customerName) validateField('customerName'); }} onBlur={() => validateField('customerName')} placeholder={copy.fullNamePlaceholder} />
                  </div>
                  {fieldErrors.customerName && <p className="text-xs text-red-600 mt-1">{fieldErrors.customerName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">{copy.phone} *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input required type="tel" inputMode="numeric" maxLength={10} className={`w-full p-2.5 pl-9 border rounded-lg ${fieldErrors.phone ? 'border-red-300 bg-red-50/30' : 'border-stone-200'}`} value={form.phone} onChange={e => { set('phone', e.target.value.replace(/[^\d]/g, '')); if (fieldErrors.phone) validateField('phone'); }} onBlur={() => validateField('phone')} placeholder={copy.phonePlaceholder} />
                  </div>
                  {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">{copy.emailOptional}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="email" pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$" title="Please enter a valid email address" className="w-full p-2.5 pl-9 border border-stone-200 rounded-lg" value={form.email} onChange={e => set('email', e.target.value)} placeholder={copy.emailPlaceholder} />
                </div>
              </div>
              <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" value={form.website} onChange={e => set('website', e.target.value)} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-4">
              <h2 className="text-lg font-bold text-stone-800">{copy.deliveryAddress}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setDeliveryZone('inside'); setInsideValley(true); validateField('deliveryZone'); }}
                  className={`text-left p-4 rounded-xl border transition-all ${deliveryZone === 'inside' ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-100' : 'border-stone-200 bg-white hover:border-amber-200'}`}
                >
                  <div className="flex items-center gap-2 font-bold text-stone-800"><Truck className="w-4 h-4 text-amber-600" /> {copy.insideValley}</div>
                  <p className="text-xs text-stone-500 mt-1">{copy.insideDesc}</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setDeliveryZone('outside'); setInsideValley(false); validateField('deliveryZone'); }}
                  className={`text-left p-4 rounded-xl border transition-all ${deliveryZone === 'outside' ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-100' : 'border-stone-200 bg-white hover:border-amber-200'}`}
                >
                  <div className="flex items-center gap-2 font-bold text-stone-800"><Navigation2 className="w-4 h-4 text-amber-600" /> {copy.outsideValley}</div>
                  <p className="text-xs text-stone-500 mt-1">{copy.outsideDesc}</p>
                </button>
              </div>
              {fieldErrors.deliveryZone && <p className="text-xs text-red-600 -mt-1">{fieldErrors.deliveryZone}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-bold text-stone-600 mb-1">{copy.province} *</label>
                  <select
                    required
                    className={`w-full p-2.5 border rounded-lg appearance-none bg-white pr-8 ${fieldErrors.province ? 'border-red-300 bg-red-50/30' : 'border-stone-200'}`}
                    value={form.province}
                    onChange={e => { set('province', e.target.value); if (fieldErrors.province) validateField('province'); }}
                    onBlur={() => validateField('province')}
                  >
                    <option value="">{copy.selectProvince}</option>
                    {Object.keys(NEPAL_PROVINCES).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-stone-400 pointer-events-none" />
                  {fieldErrors.province && <p className="text-xs text-red-600 mt-1">{fieldErrors.province}</p>}
                </div>
                <div className="relative">
                  <label className="block text-sm font-bold text-stone-600 mb-1">{copy.district} *</label>
                  <select
                    required
                    disabled={!form.province}
                    className={`w-full p-2.5 border rounded-lg appearance-none bg-white pr-8 disabled:bg-stone-50 disabled:text-stone-400 ${fieldErrors.district ? 'border-red-300 bg-red-50/30' : 'border-stone-200'}`}
                    value={form.district}
                    onChange={e => { set('district', e.target.value); if (fieldErrors.district) validateField('district'); }}
                    onBlur={() => validateField('district')}
                  >
                    <option value="">{form.province ? copy.selectDistrict : copy.selectProvinceFirst}</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-stone-400 pointer-events-none" />
                  {fieldErrors.district && <p className="text-xs text-red-600 mt-1">{fieldErrors.district}</p>}
                </div>
              </div>

              {form.district && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">
                    {isInsideValley ? copy.valleyText : copy.outsideText} - delivery: {estimatedDelivery}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">{copy.fullAddress} *</label>
                <div className="relative">
                  <input
                    required
                    className={`w-full p-2.5 border rounded-lg ${fieldErrors.address ? 'border-red-300 bg-red-50/30' : 'border-stone-200'}`}
                    value={form.address}
                    onChange={e => {
                      set('address', e.target.value);
                      setSelectedLatLon(null);
                      fetchAddressSuggestions(e.target.value);
                      if (fieldErrors.address) validateField('address');
                    }}
                    onBlur={() => {
                      validateField('address');
                      setTimeout(() => setShowSuggestions(false), 120);
                    }}
                    onFocus={() => { if (addressSuggestions.length > 0) setShowSuggestions(true); }}
                    placeholder={copy.addressPlaceholder}
                  />
                  {isAddressLoading && <Loader2 className="w-4 h-4 animate-spin text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-xl max-h-64 overflow-auto">
                      {addressSuggestions.map((s, idx) => (
                        <button
                          key={`${s.lat}-${s.lon}-${idx}`}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 border-b border-stone-100 last:border-b-0"
                          onClick={() => {
                            set('address', s.display_name);
                            setSelectedLatLon({ lat: s.lat, lon: s.lon });
                            const inferred = inferProvinceDistrict(s);
                            if (inferred.province) set('province', inferred.province);
                            if (inferred.district) set('district', inferred.district);
                            setShowSuggestions(false);
                            setAddressHintError('');
                            validateField('address');
                            if (inferred.province) validateField('province');
                            if (inferred.district) validateField('district');
                          }}
                        >
                          {s.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 mt-1">{copy.addressHint}</p>
                {addressHintError && <p className="text-xs text-amber-700 mt-1">{addressHintError}</p>}
                {selectedLatLon && <p className="text-[11px] text-stone-400 mt-1">{copy.locationSaved}</p>}
                {fieldErrors.address && <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">{copy.landmark}</label>
                  <input className="w-full p-2.5 border border-stone-200 rounded-lg" value={form.landmark} onChange={e => set('landmark', e.target.value)} placeholder={copy.nearPlaceholder} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">{copy.notes}</label>
                  <input className="w-full p-2.5 border border-stone-200 rounded-lg" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder={copy.specialInstructions} />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 sticky top-24 space-y-4">
            <h2 className="text-lg font-bold text-stone-800">{copy.summary}</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                    <Image src={optimizeImage(item.images[0])} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-900 truncate">{item.name}</p>
                    <p className="text-xs text-stone-500">{copy.qty}: {item.quantity}</p>
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
                <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider">{copy.promoCode}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={appliedCoupon !== null}
                    placeholder={copy.enterCode}
                    className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-stone-100 disabled:text-stone-500 uppercase"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-4 py-2 bg-stone-200 text-stone-700 text-sm font-bold rounded-md hover:bg-stone-300 transition-colors"
                    >
                      {copy.remove}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="px-4 py-2 bg-stone-900 text-white text-sm font-bold rounded-md hover:bg-stone-800 transition-colors disabled:opacity-50"
                    >
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
                <span className="font-bold">NPR {subtotal.toLocaleString()}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-700 bg-green-50 border border-green-100 rounded-lg px-2 py-1">
                  <span className="flex items-center gap-1">{copy.savings}</span>
                  <span className="font-bold">- NPR {totalDiscount.toLocaleString()}</span>
                </div>
              )}
              {couponDiscountAmount > 0 && (
                <div className="flex justify-between text-green-700 bg-green-50 border border-green-100 rounded-lg px-2 py-1">
                  <span className="flex items-center gap-1">{copy.coupon} ({appliedCoupon?.code})</span>
                  <span className="font-bold">- NPR {couponDiscountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-stone-500 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {copy.deliveryCharge}</span>
                <span className="font-bold">
                  {deliveryCharge === 0 ? (
                    <span className="text-green-600">{copy.free}</span>
                  ) : (
                    `NPR ${deliveryCharge.toLocaleString()}`
                  )}
                </span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-500 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> {copy.codFee}</span>
                  <span className="font-bold">NPR {codFee}</span>
                </div>
              )}
              {form.district && (
                <div className="flex justify-between text-xs text-stone-400 items-center gap-1">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {copy.estDelivery}</span>
                  <span>{estimatedDelivery}</span>
                </div>
              )}
              <div className="flex justify-between text-lg pt-2 border-t border-stone-200">
                <span className="font-bold text-stone-900">{copy.finalTotal}</span>
                <span className="font-extrabold text-stone-900 text-xl">NPR {finalTotal.toLocaleString()}</span>
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
        </div>
      </div>
    </div>
  );
}
