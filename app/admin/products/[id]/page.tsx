'use client';

import React, { useState, useEffect, use } from 'react';
import { updateProduct, deleteProduct } from '../../actions';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X, ArrowLeft, ListPlus, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { VideoUpload } from '@/components/admin/VideoUpload';
import { RichTextEditor } from '@/components/RichTextEditor';
import { toast } from 'sonner';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [data, setData] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Dynamic Lists State
  const [features, setFeatures] = useState<string[]>(['']);
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [comparisonImages, setComparisonImages] = useState<string[]>([]);
  const [bundleItemIds, setBundleItemIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadError(null);
        const [catResp, listResp, productResp] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
          fetch(`/api/products/${resolvedParams.id}`),
        ]);

        const [catRes, prodRes, productRes] = await Promise.all([
          catResp.json(),
          listResp.json(),
          productResp.json(),
        ]);

        if (!catResp.ok || !Array.isArray(catRes)) throw new Error('Failed to load categories');
        if (!listResp.ok || !Array.isArray(prodRes)) throw new Error('Failed to load products');

        setCategories(catRes);
        setProducts(prodRes);

        if (!productResp.ok || !productRes) {
          setLoadError('Product not found');
          toast.error('Product not found');
          router.push('/admin/products');
          return;
        }

        setData(productRes);
        setFeatures(productRes.features?.length ? productRes.features : ['']);
        setBenefits(productRes.benefits?.length ? productRes.benefits : ['']);
        setFaqs(Array.isArray(productRes.faqs) ? productRes.faqs : []);
        setTags(productRes.tags || []);
        setComparisonImages(productRes.comparisonImages || []);
        setBundleItemIds(productRes.bundleItemIds || []);
      } catch (e) {
        setLoadError('Failed to load product data');
        toast.error('Failed to load data');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [resolvedParams.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.images || data.images.length === 0) { toast.error('At least one image required'); return; }
    setLoading(true);
    const result = await updateProduct(resolvedParams.id, {
      ...data,
      features: features.filter(Boolean),
      benefits: benefits.filter(Boolean),
      faqs,
      tags,
      comparisonImages,
      bundleItemIds,
    });
    if (result.success) {
      toast.success('Product updated!');
      router.push('/admin/products');
    } else {
      toast.error('Failed to update');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this product? This action cannot be undone and will fail if the product is tied to past orders.')) return;
    setLoading(true);
    const res = await deleteProduct(resolvedParams.id);
    if (res.success) {
      toast.success('Product deleted permanently');
      router.push('/admin/products');
    } else {
      toast.error(res.error || 'Failed to delete product');
      setLoading(false);
    }
  };

  const set = (key: string, value: unknown) => setData((prev: any) => ({ ...prev, [key]: value }));

  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => setter(prev => [...prev, '']);
  const updateItem = (i: number, val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter(prev => prev.map((item, idx) => idx === i ? val : item));
  const removeItem = (i: number, setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter(prev => prev.filter((_, idx) => idx !== i));

  const addFaq = () => setFaqs(prev => [...prev, { q: '', a: '' }]);
  const updateFaq = (i: number, key: 'q' | 'a', val: string) =>
    setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, [key]: val } : f));
  const removeFaq = (i: number) => setFaqs(prev => prev.filter((_, idx) => idx !== i));

  if (fetching) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-stone-400" /></div>;

  if (!data) {
    return (
      <div className="max-w-3xl bg-white border border-stone-200 rounded-xl p-6">
        <h1 className="text-xl font-serif font-bold text-stone-900 mb-2">Unable to load product</h1>
        <p className="text-sm text-stone-500 mb-4">{loadError || 'This product may have been removed.'}</p>
        <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm font-bold text-stone-800 hover:text-stone-900">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl pb-20">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 line-clamp-1">{data.name}</h1>
          <p className="text-stone-500 text-sm">Update premium product listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <Section title="Basic Information">
            <div className="space-y-4">
              <div>
                <Label>Product Name *</Label>
                <input required className="w-full p-2 border rounded-lg" value={data.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <select className="w-full p-2 border rounded-lg" value={data.categoryId || ''} onChange={e => set('categoryId', e.target.value)}>
                    <option value="">Uncategorized</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>SKU</Label>
                  <input className="w-full p-2 border rounded-lg" value={data.sku || ''} onChange={e => set('sku', e.target.value)} placeholder="e.g. LM-SH-001" />
                </div>
              </div>
              <div>
                <Label>Short Description *</Label>
                <textarea required className="w-full p-2 border rounded-lg" rows={3} value={data.description} onChange={e => set('description', e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Marketing Content */}
          <Section title="Premium Marketing Content">
            <div className="space-y-4">
              <div>
                <Label>Long Marketing Description</Label>
                <RichTextEditor content={data.marketingDescription || ''} onChange={v => set('marketingDescription', v)} placeholder="Elaborate on the product's story, feel, and results." />
              </div>
              <div>
                <Label>Ingredients List</Label>
                <textarea className="w-full p-2 border rounded-lg text-sm" rows={3} value={data.ingredients || ''} onChange={e => set('ingredients', e.target.value)} placeholder="Full list of ingredients." />
              </div>
              <div>
                <Label>How to Use</Label>
                <textarea className="w-full p-2 border rounded-lg" rows={3} value={data.howToUse || ''} onChange={e => set('howToUse', e.target.value)} placeholder="Step by step application instructions." />
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
                      <button type="button" onClick={() => removeItem(i, setBenefits)} className="p-2 text-stone-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addItem(setBenefits)} className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors">+ Add Benefit</button>
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
                    <div key={i} className="p-4 bg-stone-50 rounded-lg space-y-2 relative border border-stone-100">
                      <button type="button" onClick={() => removeFaq(i)} className="absolute top-2 right-2 p-1 text-stone-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                      <input className="w-full p-2 border rounded bg-white text-sm" placeholder="Question" value={f.q} onChange={e => updateFaq(i, 'q', e.target.value)} />
                      <textarea className="w-full p-2 border rounded bg-white text-sm" placeholder="Answer" rows={2} value={f.a} onChange={e => updateFaq(i, 'a', e.target.value)} />
                    </div>
                  ))}
                  <button type="button" onClick={addFaq} className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors">+ Add FAQ</button>
                </div>
              </div>
            </div>
          </Section>

          {/* Media */}
          <Section title="Media">
            <div className="space-y-6">
              <div>
                <Label>Primary Images *</Label>
                <ImageUpload images={data.images || []} onChange={urls => set('images', urls)} maxImages={8} />
              </div>
              <div>
                <Label>Video URL</Label>
                <VideoUpload videoUrl={data.videoUrl || ''} onChange={url => set('videoUrl', url)} />
              </div>
            </div>
          </Section>

          {/* Features */}
          <Section title="Product Features">
            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input className="flex-1 p-2 border rounded-lg text-sm" placeholder={`Feature ${i + 1}`} value={f} onChange={e => updateItem(i, e.target.value, setFeatures)} />
                  <button type="button" onClick={() => removeItem(i, setFeatures)} className="p-2 text-stone-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => addItem(setFeatures)} className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors">+ Add Feature</button>
            </div>
          </Section>
        </div>

        <div className="space-y-8">
          {/* Status & Actions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 sticky top-8 z-10">
            <button disabled={loading} className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-stone-800 disabled:opacity-50 mb-4 transition-all active:scale-[0.98]">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Save Changes'}
            </button>
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Toggle label="Active (Visible to public)" checked={data.isActive ?? true} onChange={v => set('isActive', v)} />
              <Toggle label="Draft (Hidden from public)" checked={data.isDraft || false} onChange={v => set('isDraft', v)} />
              <Toggle label="Archived (Soft Deleted)" checked={data.isArchived || false} onChange={v => set('isArchived', v)} />
              <div className="my-2 border-t border-stone-100" />
              <Toggle label="Featured Product" checked={data.isFeatured || false} onChange={v => set('isFeatured', v)} />
              <Toggle label="Mark as New" checked={data.isNew || false} onChange={v => set('isNew', v)} />
              <Toggle label="Is Product Bundle" checked={data.isBundle || false} onChange={v => set('isBundle', v)} />
            </div>
            {data.isArchived && (
              <div className="pt-4 mt-4 border-t border-stone-100">
                <button type="button" onClick={handleDelete} disabled={loading} className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-colors disabled:opacity-50 text-sm">
                  Delete Product
                </button>
              </div>
            )}
          </div>

          {/* Pricing & Stock */}
          <Section title="Pricing & Stock">
            <div className="space-y-4">
              <div>
                <Label>Price (Inside)</Label>
                <input type="number" required className="w-full p-2 border rounded-lg text-lg font-bold" value={data.priceInside} onChange={e => set('priceInside', parseInt(e.target.value))} />
              </div>
              <div>
                <Label>Price (Outside)</Label>
                <input type="number" required className="w-full p-2 border rounded-lg" value={data.priceOutside} onChange={e => set('priceOutside', parseInt(e.target.value))} />
              </div>
              <div>
                <Label>Original Price (MSRP)</Label>
                <input type="number" className="w-full p-2 border rounded-lg text-stone-500" value={data.originalPrice || ''} onChange={e => set('originalPrice', e.target.value ? parseInt(e.target.value) : null)} />
              </div>
              <div>
                <Label>Current Stock</Label>
                <input type="number" required className="w-full p-2 border rounded-lg" value={data.stock} onChange={e => set('stock', parseInt(e.target.value))} />
              </div>
            </div>
          </Section>

          {/* SEO */}
          <Section title="Search Appearance & Configurations">
            <div className="space-y-4">
              <div>
                <Label>Meta Title</Label>
                <input className="w-full p-2 border rounded-lg text-sm" value={data.seoTitle || ''} onChange={e => set('seoTitle', e.target.value)} />
              </div>
              <div>
                <Label>Meta Description</Label>
                <textarea className="w-full p-2 border rounded-lg text-sm" rows={3} value={data.seoDescription || ''} onChange={e => set('seoDescription', e.target.value)} />
              </div>
              {data.isBundle && (
                <div className="pt-4 border-t border-stone-100">
                  <Label>Select Products Included in Bundle</Label>
                  <p className="text-xs text-stone-500 mb-2">When this bundle is sold, stock will be deducted from these items.</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-stone-50 rounded-lg border border-stone-200">
                    {products.filter(p => p.id !== data.id).map(p => (
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
