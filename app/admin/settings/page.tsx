'use client';

import React, { useState, useEffect } from 'react';
import { updateSiteConfig } from '../actions';
import { Loader2, Save } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { RichTextEditor } from '@/components/RichTextEditor';
import { toast } from 'sonner';

const TABS = [
  { id: 'brand', label: 'Brand' },
  { id: 'seo', label: 'SEO' },
  { id: 'contact', label: 'Contact & Social' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'content', label: 'Content Pages' },
  { id: 'notifications', label: 'Notifications' },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('brand');
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      setFormData(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateSiteConfig(formData);
    setSaving(false);
    if (result.success) toast.success('Settings saved successfully');
    else toast.error('Failed to save settings');
  };

  const set = (key: string, value: unknown) => setFormData(prev => ({ ...prev, [key]: value }));

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-stone-400" /></div>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">Store Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${tab === t.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 space-y-6">

        {tab === 'brand' && (
          <div className="space-y-6">
            <Field label="Store Name" value={String(formData.storeName || '')} onChange={v => set('storeName', v)} />
            <Field label="Banner Text" value={String(formData.bannerText || '')} onChange={v => set('bannerText', v)} />
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-2">Site Logo</label>
              <ImageUpload
                images={formData.logoUrl ? [String(formData.logoUrl)] : []}
                onChange={urls => set('logoUrl', urls[0] || null)}
                maxImages={1}
                folder="luxemoon/brand"
              />
            </div>
          </div>
        )}

        {tab === 'seo' && (
          <div className="space-y-4">
            <Field label="Meta Title" value={String(formData.metaTitle || '')} onChange={v => set('metaTitle', v)} placeholder="e.g. Luxe Moon | Premium Korean Haircare in Nepal" />
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Meta Description</label>
              <textarea className="w-full p-2 border rounded-lg" rows={3} value={String(formData.metaDescription || '')} onChange={e => set('metaDescription', e.target.value)} placeholder="Brief description for search engines..." />
            </div>
          </div>
        )}

        {tab === 'contact' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone" value={String(formData.contactPhone || '')} onChange={v => set('contactPhone', v)} />
              <Field label="Email" value={String(formData.contactEmail || '')} onChange={v => set('contactEmail', v)} />
              <Field label="WhatsApp Number" value={String(formData.whatsappNumber || '')} onChange={v => set('whatsappNumber', v)} placeholder="+977 98XXXXXXXX" />
              <Field label="Address" value={String(formData.contactAddress || '')} onChange={v => set('contactAddress', v)} />
              <Field label="Facebook URL" value={String(formData.facebookUrl || '')} onChange={v => set('facebookUrl', v)} placeholder="https://facebook.com/..." />
              <Field label="Instagram URL" value={String(formData.instagramUrl || '')} onChange={v => set('instagramUrl', v)} placeholder="https://instagram.com/..." />
            </div>
          </div>
        )}

        {tab === 'delivery' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberField label="Charge (Inside Valley)" value={Number(formData.deliveryChargeInside ?? 0)} onChange={v => set('deliveryChargeInside', v)} />
              <NumberField label="Charge (Outside Valley)" value={Number(formData.deliveryChargeOutside ?? 0)} onChange={v => set('deliveryChargeOutside', v)} />
              <NumberField label="Free Delivery Threshold" value={Number(formData.freeDeliveryThreshold ?? 0)} onChange={v => set('freeDeliveryThreshold', v)} />
              <NumberField label="COD Fee" value={Number(formData.codFee ?? 0)} onChange={v => set('codFee', v)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Est. Delivery (Inside Valley)" value={String(formData.estimatedDeliveryInside || '')} onChange={v => set('estimatedDeliveryInside', v)} />
              <Field label="Est. Delivery (Outside Valley)" value={String(formData.estimatedDeliveryOutside || '')} onChange={v => set('estimatedDeliveryOutside', v)} />
            </div>
            <ToggleField label="Express Delivery" checked={Boolean(formData.expressDeliveryEnabled)} onChange={v => set('expressDeliveryEnabled', v)} description="Allow customers to choose express delivery at checkout" />

            <div className="border-t border-stone-200 pt-4 mt-4">
              <h3 className="text-sm font-bold text-stone-700 mb-3">Global Discount</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <NumberField label="Discount (%)" value={Number(formData.globalDiscountPercent ?? 0)} onChange={v => set('globalDiscountPercent', v)} />
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">Start Date</label>
                  <input type="datetime-local" className="w-full p-2 border rounded-lg" value={formData.globalDiscountStart ? String(formData.globalDiscountStart).slice(0, 16) : ''} onChange={e => set('globalDiscountStart', e.target.value || null)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">End Date</label>
                  <input type="datetime-local" className="w-full p-2 border rounded-lg" value={formData.globalDiscountEnd ? String(formData.globalDiscountEnd).slice(0, 16) : ''} onChange={e => set('globalDiscountEnd', e.target.value || null)} />
                </div>
              </div>
              <p className="text-xs text-stone-400 mt-1">Applied on top of product-level discounts. Leave dates empty for always-active.</p>
            </div>
          </div>
        )}

        {tab === 'content' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Footer Content</label>
              <textarea className="w-full p-2 border rounded-lg" rows={3} value={String(formData.footerContent || '')} onChange={e => set('footerContent', e.target.value)} placeholder="Short description shown in footer..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">About Page Content</label>
              <RichTextEditor content={String(formData.aboutContent || '')} onChange={v => set('aboutContent', v)} placeholder="Your brand story..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Privacy Policy</label>
              <RichTextEditor content={String(formData.privacyPolicy || '')} onChange={v => set('privacyPolicy', v)} placeholder="Your privacy policy text..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Terms & Conditions</label>
              <RichTextEditor content={String(formData.termsConditions || '')} onChange={v => set('termsConditions', v)} placeholder="Your terms and conditions..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Delivery Policy</label>
              <RichTextEditor content={String(formData.deliveryPolicy || '')} onChange={v => set('deliveryPolicy', v)} placeholder="Your delivery policy..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Refund Policy</label>
              <RichTextEditor content={String(formData.refundPolicy || '')} onChange={v => set('refundPolicy', v)} placeholder="Your refund policy..." />
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="space-y-4">
            <ToggleField label="Email Notifications" checked={Boolean(formData.emailNotificationsEnabled)} onChange={v => set('emailNotificationsEnabled', v)} description="Send email notifications for order status changes (requires RESEND_API_KEY)" />
            <ToggleField label="SMS Notifications" checked={Boolean(formData.smsNotificationsEnabled)} onChange={v => set('smsNotificationsEnabled', v)} description="Send SMS notifications via Sparrow SMS (requires SPARROW_SMS_TOKEN)" />
          </div>
        )}

        <button
          disabled={saving}
          className="px-6 py-3 bg-stone-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-stone-800 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-bold text-stone-600 mb-1">{label}</label>
      <input className="w-full p-2 border rounded-lg" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-bold text-stone-600 mb-1">{label}</label>
      <input type="number" className="w-full p-2 border rounded-lg" value={value} onChange={e => onChange(parseInt(e.target.value) || 0)} />
    </div>
  );
}

function ToggleField({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg">
      <button type="button" onClick={() => onChange(!checked)}
        className={`mt-0.5 w-10 h-5 rounded-full p-0.5 transition-colors flex-shrink-0 ${checked ? 'bg-amber-500' : 'bg-stone-300'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <div>
        <div className="text-sm font-bold text-stone-700">{label}</div>
        {description && <div className="text-xs text-stone-500 mt-0.5">{description}</div>}
      </div>
    </div>
  );
}