'use client';

import React, { useState, useEffect } from 'react';
import { createProduct } from '../../actions';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X, ListPlus, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { VideoUpload } from '@/components/admin/VideoUpload';
import { RichTextEditor } from '@/components/RichTextEditor';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

export default function NewProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);

  // Media State
  const [images, setImages] = useState<string[]>([]);
  const [comparisonImages, setComparisonImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [bundleItemIds, setBundleItemIds] = useState<string[]>([]);

  // Dynamic Lists State
  const [features, setFeatures] = useState<string[]>(['']);
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    name: '', description: '', priceInside: '', priceOutside: '', originalPrice: '',
    categoryId: '', stock: '0', sku: '', weight: '', dimensions: '',
    discountPercent: '0', discountFixed: '', discountStart: '', discountEnd: '',
    isFeatured: false, isNew: false, isBundle: false,
    seoTitle: '', seoDescription: '',
    marketingDescription: '', ingredients: '', howToUse: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/products').then(res => res.json())
    ]).then(([catData, prodData]) => {
      setCategories(catData);
      setProducts(prodData);
      if (catData.length > 0) set('categoryId', catData[0].id);
    });
  }, []);

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) { toast.error('At least one image is required'); return; }
    setLoading(true);
    const result = await createProduct({
      ...form,
      priceInside: parseInt(form.priceInside) || 0,
      priceOutside: parseInt(form.priceOutside) || 0,
      originalPrice: form.originalPrice ? parseInt(form.originalPrice) : null,
      stock: parseInt(form.stock) || 0,
      discountPercent: parseInt(form.discountPercent) || 0,
      discountFixed: form.discountFixed ? parseInt(form.discountFixed) : null,
      discountStart: form.discountStart || null,
      discountEnd: form.discountEnd || null,
      images,
      comparisonImages,
      videoUrl: videoUrl || null,
      features: features.filter(Boolean),
      benefits: benefits.filter(Boolean),
      faqs,
      tags,
      bundleItemIds,
    });
    if (result.success) {
      toast.success('Product created!');
      router.push('/admin/products');
    } else {
      toast.error('Failed to create product');
      setLoading(false);
    }
  };

  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => setter(prev => [...prev, '']);
  const updateItem = (i: number, val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter(prev => prev.map((item, idx) => idx === i ? val : item));
  const removeItem = (i: number, setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter(prev => prev.filter((_, idx) => idx !== i));

  const addFaq = () => setFaqs(prev => [...prev, { q: '', a: '' }]);
  const updateFaq = (i: number, key: 'q' | 'a', val: string) =>
    setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, [key]: val } : f));
  const removeFaq = (i: number) => setFaqs(prev => prev.filter((_, idx) => idx !== i));

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <div className="max-w-5xl pb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">New Product</h1>
          <p className="text-stone-500">Create a premium product listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <Section title="Basic Information">
            <div className="space-y-4">
              <div>
                <Label>Product Name *</Label>
                <input required className="w-full p-2 border rounded-lg" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <select className="w-full p-2 border rounded-lg" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>SKU</Label>
                  <input className="w-full p-2 border rounded-lg" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. LM-SH-001" />
                </div>
              </div>
              <div>
                <Label>Short Description *</Label>
                <textarea required className="w-full p-2 border rounded-lg" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Marketing Content */}
          <Section title="Premium Marketing Content">
            <div className="space-y-4">
              <div>
                <Label>Long Marketing Description</Label>
                <RichTextEditor content={form.marketingDescription} onChange={v => set('marketingDescription', v)} placeholder="Elaborate on the product's story, feel, and results." />
              </div>
              <div>
                <Label>Ingredients List</Label>
                <textarea className="w-full p-2 border rounded-lg text-sm" rows={3} value={form.ingredients} onChange={e => set('ingredients', e.target.value)} placeholder="Full list of ingredients." />
              </div>
              <div>
                <Label>How to Use</Label>
                <textarea className="w-full p-2 border rounded-lg" rows={3} value={form.howToUse} onChange={e => set('howToUse', e.target.value)} placeholder="Step by step application instructions." />
              </div>
            </div>
          </Section>

          {/* Marketing Assets */}
          <Section title="Marketing Assets">
            <div className="space-y-6">
              <div>
                <Label icon={<ListPlus />}>Brand Benefits</Label>
                <div className="space-y-2">
                  {benefits.map((b, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="flex-1 p-2 border rounded-lg text-sm" placeholder="e.g. Intensive Repair" value={b} onChange={e => updateItem(i, e.target.value, setBenefits)} />
                      <button type="button" onClick={() => removeItem(i, setBenefits)} className="p-2 text-stone-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addItem(setBenefits)} className="text-xs font-bold text-stone-500 hover:text-stone-900">+ Add Benefit</button>
                </div>
              </div>

              <div>
                <Label icon={<ImageIcon />}>Before/After Comparison Images</Label>
                <ImageUpload images={comparisonImages} onChange={setComparisonImages} maxImages={4} />
                <p className="text-xs text-stone-400 mt-1">Showcase results to build trust.</p>
              </div>

              <div>
                <Label icon={<HelpCircle />}>FAQs</Label>
                <div className="space-y-4">
                  {faqs.map((f, i) => (
                    <div key={i} className="p-4 bg-stone-50 rounded-lg space-y-2 relative">
                      <button type="button" onClick={() => removeFaq(i)} className="absolute top-2 right-2 p-1 text-stone-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      <input className="w-full p-2 border rounded bg-white text-sm" placeholder="Question" value={f.q} onChange={e => updateFaq(i, 'q', e.target.value)} />
                      <textarea className="w-full p-2 border rounded bg-white text-sm" placeholder="Answer" rows={2} value={f.a} onChange={e => updateFaq(i, 'a', e.target.value)} />
                    </div>
                  ))}
                  <button type="button" onClick={addFaq} className="text-xs font-bold text-stone-500 hover:text-stone-900">+ Add FAQ</button>
                </div>
              </div>
            </div>
          </Section>

          {/* Media */}
          <Section title="Media">
            <div className="space-y-6">
              <div>
                <Label>Primary Images *</Label>
                <ImageUpload images={images} onChange={setImages} maxImages={8} />
              </div>
              <div>
                <Label>Video URL</Label>
                <VideoUpload videoUrl={videoUrl} onChange={setVideoUrl} />
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-8">
          {/* Status & Actions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 sticky top-8">
            <button disabled={loading} className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-stone-800 disabled:opacity-50 mb-4 transition-all active:scale-[0.98]">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Publish Product'}
            </button>
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Toggle label="Featured Product" checked={form.isFeatured} onChange={v => set('isFeatured', v)} />
              <Toggle label="Mark as New" checked={form.isNew} onChange={v => set('isNew', v)} />
              <Toggle label="Is Product Bundle" checked={form.isBundle} onChange={v => set('isBundle', v)} />
            </div>
          </div>

          {/* Pricing & Stock */}
          <Section title="Pricing & Stock">
            <div className="space-y-4">
              <div>
                <Label>Price (Inside)</Label>
                <input type="number" required className="w-full p-2 border rounded-lg text-lg font-bold" value={form.priceInside} onChange={e => set('priceInside', e.target.value)} />
              </div>
              <div>
                <Label>Price (Outside)</Label>
                <input type="number" required className="w-full p-2 border rounded-lg" value={form.priceOutside} onChange={e => set('priceOutside', e.target.value)} />
              </div>
              <div>
                <Label>Original Price (MSRP)</Label>
                <input type="number" className="w-full p-2 border rounded-lg text-stone-500" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} />
              </div>
              <div>
                <Label>Current Stock</Label>
                <input type="number" required className="w-full p-2 border rounded-lg" value={form.stock} onChange={e => set('stock', e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Logistics */}
          <Section title="Logistics & Configurations">
            <div className="space-y-4">
              <div>
                <Label>Weight</Label>
                <input className="w-full p-2 border rounded-lg" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="e.g. 500ml / 250g" />
              </div>
              <div>
                <Label>Dimensions</Label>
                <input className="w-full p-2 border rounded-lg" value={form.dimensions} onChange={e => set('dimensions', e.target.value)} placeholder="L x W x H" />
              </div>
              {form.isBundle && (
                <div className="pt-4 border-t border-stone-100">
                  <Label>Select Products Included in Bundle</Label>
                  <p className="text-xs text-stone-500 mb-2">When this bundle is sold, stock will be deducted from these individual items.</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-stone-50 rounded-lg border border-stone-200">
                    {products.filter(p => p.id !== form.name).map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer p-1">
                        <input
                          type="checkbox"
                          checked={bundleItemIds.includes(p.id)}
                          onChange={e => {
                            if (e.target.checked) setBundleItemIds(prev => [...prev, p.id]);
                            else setBundleItemIds(prev => prev.filter(id => id !== p.id));
                          }}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* SEO */}
          <Section title="Search Appearance">
            <div className="space-y-4">
              <div>
                <Label>Meta Title</Label>
                <input className="w-full p-2 border rounded-lg text-sm" value={form.seoTitle} onChange={e => set('seoTitle', e.target.value)} />
              </div>
              <div>
                <Label>Meta Description</Label>
                <textarea className="w-full p-2 border rounded-lg text-sm" rows={2} value={form.seoDescription} onChange={e => set('seoDescription', e.target.value)} />
              </div>
            </div>
          </Section>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-6 pb-2 border-b border-stone-50">{title}</h2>
      {children}
    </div>
  );
}

function Label({ children, icon }: { children: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold text-stone-600 mb-1.5">
      {icon && <span className="text-stone-400 w-4 h-4">{icon}</span>}
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm font-bold text-stone-600 group-hover:text-stone-900 transition-colors">{label}</span>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-amber-600' : 'bg-stone-200'}`}>
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
    </label>
  );
}
