'use client';
import React, { useState } from 'react';
import { createProduct } from '../../actions';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NewProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Default structure
  const [data, setData] = useState({
    name: '',
    description: '',
    priceInside: 0,
    priceOutside: 0,
    originalPrice: 0,
    stock: 0,
    category: '',
    images: [''],
    videoUrl: '',
    features: ['']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Filter out empty strings
    const cleanData = {
      ...data,
      images: data.images.filter(i => i.trim() !== ''),
      features: data.features.filter(f => f.trim() !== '')
    };
    await createProduct(cleanData);
    router.push('/admin/products');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Product</h1>
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
            <label className="block text-sm font-bold mb-1">Original Price (Strike-through)</label>
            <input type="number" className="w-full p-2 border rounded" value={data.originalPrice} onChange={e => setData({...data, originalPrice: parseInt(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Stock</label>
            <input type="number" required className="w-full p-2 border rounded" value={data.stock} onChange={e => setData({...data, stock: parseInt(e.target.value)})} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Category</label>
          <input required className="w-full p-2 border rounded" value={data.category} onChange={e => setData({...data, category: e.target.value})} />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Image URL (Main)</label>
          <input required className="w-full p-2 border rounded" value={data.images[0]} onChange={e => setData({...data, images: [e.target.value]})} placeholder="https://..." />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Video URL (Optional)</label>
          <input className="w-full p-2 border rounded" value={data.videoUrl} onChange={e => setData({...data, videoUrl: e.target.value})} placeholder="https://..." />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Feature 1</label>
          <input required className="w-full p-2 border rounded" value={data.features[0]} onChange={e => setData({...data, features: [e.target.value]})} />
        </div>

        <button disabled={loading} className="w-full py-3 bg-stone-900 text-white rounded-lg font-bold flex justify-center">
          {loading ? <Loader2 className="animate-spin" /> : 'Create Product'}
        </button>
      </form>
    </div>
  );
}