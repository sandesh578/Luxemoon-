'use client';
import React, { useState, useEffect, use } from 'react';
import { updateProduct } from '../../actions';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(products => {
      const p = products.find((x: any) => x.id === resolvedParams.id);
      if (p) setData(p);
    });
  }, [resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateProduct(resolvedParams.id, data);
    router.push('/admin/products');
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-bold mb-1">Product Name</label>
          <input required className="w-full p-2 border rounded" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
        </div>
        
        <div>
          <label className="block text-sm font-bold mb-1">Description</label>
          <textarea required className="w-full p-2 border rounded" rows={4} value={data.description} onChange={e => setData({...data, description: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Price (Inside Valley)</label>
            <input type="number" required className="w-full p-2 border rounded" value={data.priceInside} onChange={e => setData({...data, priceInside: parseInt(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Price (Outside Valley)</label>
            <input type="number" required className="w-full p-2 border rounded" value={data.priceOutside} onChange={e => setData({...data, priceOutside: parseInt(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Stock</label>
            <input type="number" required className="w-full p-2 border rounded" value={data.stock} onChange={e => setData({...data, stock: parseInt(e.target.value)})} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Video URL</label>
          <input className="w-full p-2 border rounded" value={data.videoUrl || ''} onChange={e => setData({...data, videoUrl: e.target.value})} />
        </div>

        <button disabled={loading} className="w-full py-3 bg-stone-900 text-white rounded-lg font-bold flex justify-center">
          {loading ? <Loader2 className="animate-spin" /> : 'Update Product'}
        </button>
      </form>
    </div>
  );
}