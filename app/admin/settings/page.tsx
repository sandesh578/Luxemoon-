'use client';

import React, { useState, useEffect } from 'react';
import { updateSiteConfig } from '../actions';
import { getSiteConfig } from '@/lib/settings';
import { Loader2, Save } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    // In a real client component, we'd typically use a server action to fetch initial state too,
    // but here we can just fetch via an API or pass it down. 
    // Since we are in app router, we can make the page async server component, but for form handling client is easier.
    // Let's use a simple fetch wrapper or server action to get it.
    // Actually, converting this to a Server Component that passes data to a Client Form is better.
    // But for simplicity and speed in this "audit", I'll do a client fetch pattern or simple loading.
    fetch('/api/settings').then(r => r.json()).then(data => {
      setFormData(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateSiteConfig(formData);
    setSaving(false);
    alert('Settings updated successfully');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">Store Settings</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 space-y-8">
        
        {/* General Identity */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b pb-2 text-stone-700">Brand Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Store Name</label>
              <input 
                className="w-full p-2 border rounded-lg"
                value={formData.storeName || ''}
                onChange={e => setFormData({...formData, storeName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Banner Text</label>
              <input 
                className="w-full p-2 border rounded-lg"
                value={formData.bannerText || ''}
                onChange={e => setFormData({...formData, bannerText: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Delivery Configuration */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b pb-2 text-stone-700">Delivery Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Charge (Inside Valley)</label>
              <input 
                type="number"
                className="w-full p-2 border rounded-lg"
                value={formData.deliveryChargeInside ?? 0}
                onChange={e => setFormData({...formData, deliveryChargeInside: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Charge (Outside Valley)</label>
              <input 
                type="number"
                className="w-full p-2 border rounded-lg"
                value={formData.deliveryChargeOutside ?? 0}
                onChange={e => setFormData({...formData, deliveryChargeOutside: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Free Delivery Threshold</label>
              <input 
                type="number"
                className="w-full p-2 border rounded-lg"
                value={formData.freeDeliveryThreshold ?? 0}
                onChange={e => setFormData({...formData, freeDeliveryThreshold: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b pb-2 text-stone-700">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Phone</label>
              <input 
                className="w-full p-2 border rounded-lg"
                value={formData.contactPhone || ''}
                onChange={e => setFormData({...formData, contactPhone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">Email</label>
              <input 
                className="w-full p-2 border rounded-lg"
                value={formData.contactEmail || ''}
                onChange={e => setFormData({...formData, contactEmail: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-stone-600 mb-1">Address</label>
              <input 
                className="w-full p-2 border rounded-lg"
                value={formData.contactAddress || ''}
                onChange={e => setFormData({...formData, contactAddress: e.target.value})}
              />
            </div>
          </div>
        </section>

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