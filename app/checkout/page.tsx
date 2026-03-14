'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useCart, useLocationContext, useConfig, useI18n } from '@/components/Providers';
import { useRouter } from 'next/navigation';
import { Loader2, Truck, AlertCircle, Navigation2, User, Phone, Mail, MapPin } from 'lucide-react';
import { getDistrictsForProvince, isValleyDistrict } from '@/lib/nepal-data';
import { z } from 'zod';

const CheckoutFormSchema = z.object({
  customerName: z.string().trim().min(1, 'Please enter your full name so we know who to deliver to.'),
  phone: z.string().trim().regex(/^9[78]\d{8}$/, 'Please enter a valid Nepali mobile number (98XXXXXXXX).'),
  address: z.string().trim().min(1, 'Kindly provide your delivery address.'),
  province: z.string().optional(),
  district: z.string().optional(),
  deliveryZone: z.enum(['inside', 'outside'], { message: 'Please select your delivery location.' }),
});

type CheckoutField = keyof z.infer<typeof CheckoutFormSchema>;


const AddressAutocompleteField = dynamic(() => import('@/components/checkout/AddressAutocompleteField'));
const CheckoutSummary = dynamic(() => import('@/components/checkout/CheckoutSummary'));

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

  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>(undefined);

  const [form, setForm] = useState({
    customerName: '', phone: '', email: '', province: '', district: '',
    address: '', landmark: '', notes: '', website: '',
  });
  const [deliveryZone, setDeliveryZone] = useState<'inside' | 'outside' | ''>('');

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
  const estimatedDelivery = isInsideValley ? config.estimatedDeliveryInside : config.estimatedDeliveryOutside;

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const setFieldError = (field: CheckoutField, message?: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  };

  const fallbackFieldMessage = (field: CheckoutField): string => {
    if (field === 'customerName') return isNe ? 'कृपया तपाईंको पूरा नाम लेख्नुहोस् ताकि हामी सही व्यक्तिलाई डेलिभरी गर्न सकौं।' : 'Please enter your full name so we know who to deliver to.';
    if (field === 'phone') return isNe ? 'कृपया मान्य नेपाली मोबाइल नम्बर लेख्नुहोस् (98XXXXXXXX)।' : 'Please enter a valid Nepali mobile number (98XXXXXXXX).';
    if (field === 'address') return isNe ? 'कृपया डेलिभरी ठेगाना लेख्नुहोस्।' : 'Kindly provide your delivery address.';
    if (field === 'deliveryZone') return isNe ? 'कृपया डेलिभरी स्थान छान्नुहोस्।' : 'Please select your delivery location.';
    return isNe ? 'कृपया यो विवरण जाँच गर्नुहोस्।' : 'Please check this field.';
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
          couponCode: appliedCouponCode || undefined,
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
                <AddressAutocompleteField
                  value={form.address}
                  placeholder={copy.addressPlaceholder}
                  hint={copy.addressHint}
                  couldntFetchAddress={copy.couldntFetchAddress}
                  locationSaved={copy.locationSaved}
                  error={fieldErrors.address}
                  onChange={(value) => {
                    set('address', value);
                    if (fieldErrors.address) validateField('address');
                  }}
                  onBlur={() => {
                    validateField('address');
                  }}
                  onProvinceDetected={(value) => set('province', value)}
                  onDistrictDetected={(value) => set('district', value)}
                />
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
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <CheckoutSummary
            items={items}
            isInsideValley={isInsideValley}
            freeDeliveryThreshold={config.freeDeliveryThreshold}
            deliveryChargeInside={config.deliveryChargeInside}
            deliveryChargeOutside={config.deliveryChargeOutside}
            codFee={codFee}
            estimatedDelivery={estimatedDelivery}
            formDistrict={form.district}
            copy={copy}
            loading={loading}
            error={error}
            showValidationSummary={showValidationSummary}
            onCouponCodeChange={setAppliedCouponCode}
          />
        </div>
      </div>
    </div>
  );
}
