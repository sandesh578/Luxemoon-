import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 60; // ISR

export default async function ShopPage() {
  const products = await prisma.product.findMany();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="font-serif text-4xl font-bold text-stone-900 mb-2">The Collection</h1>
          <p className="text-stone-500">Formulated in Seoul. Delivered to Nepal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        {products.map(product => (
          <Link 
            key={product.id} 
            href={`/products/${product.slug}`}
            className="group cursor-pointer block"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-200 mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
              <img 
                src={product.images[0]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center pointer-events-none">
                  <span className="bg-stone-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full">Sold Out</span>
                </div>
              )}
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg text-stone-900 group-hover:text-amber-700 transition-colors">
                {product.name}
              </h3>
              <p className="text-stone-800 font-bold">NPR {product.priceInside.toLocaleString()}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}