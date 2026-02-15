'use client';
import { useState } from 'react';
import { Minus, Plus, MessageCircle, Check, Link as LinkIcon } from 'lucide-react';
import { useCart } from '@/components/Providers';
import { Product } from '@/components/Providers';

export const ProductActions = ({ product }: { product: Product }) => {
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleWhatsApp = () => {
    const text = `Check out this ${product.name} from Luxe Moon!\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1">
          <button 
            className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-amber-700" 
            onClick={() => setQty(Math.max(1, qty - 1))}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-bold text-lg">{qty}</span>
          <button 
            className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-amber-700" 
            onClick={() => setQty(Math.min(product.stock, qty + 1))}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <button 
          className="flex-1 py-4 text-lg bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg rounded-2xl font-bold disabled:opacity-50" 
          onClick={() => addToCart(product, qty)}
          disabled={product.stock <= 0}
        >
          {product.stock > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
        </button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <button 
          onClick={handleWhatsApp} 
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-green-500 text-green-600 rounded-2xl hover:bg-green-50 font-bold text-sm"
        >
          <MessageCircle className="w-4 h-4" /> Share on WhatsApp
        </button>
        <button 
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 rounded-2xl font-bold text-sm transition-colors ${copied ? 'bg-stone-800 text-white border-stone-800' : 'border-amber-600 text-amber-700'}`}
        >
          {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
          {copied ? 'Link Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
};