import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProductActions } from './ProductActions';
import { Star, Check, Truck, PlayCircle } from 'lucide-react';
import type { Metadata } from 'next';
import { getSiteConfig } from '@/lib/settings';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const product = await prisma.product.findUnique({ where: { slug } });

  if (!product) return { title: 'Product Not Found' };

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.images[0]],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.images[0]],
    },
  };
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export const revalidate = 60;

export default async function ProductPage({ params }: Props) {
  const slug = (await params).slug;
  const product = await prisma.product.findUnique({ 
    where: { slug },
    include: { reviews: true }
  });

  if (!product) notFound();
  const config = await getSiteConfig();

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images[0],
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.priceInside,
      priceCurrency: 'NPR',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="pt-8 pb-24 px-4 max-w-7xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        <div className="space-y-4">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-stone-100 shadow-inner relative group">
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            {product.videoUrl && (
              <a 
                href={product.videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-full shadow-lg hover:scale-110 transition-transform text-amber-600"
              >
                <PlayCircle className="w-8 h-8" />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-amber-600 font-bold tracking-widest text-xs uppercase mb-4">{product.category}</span>
          <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-6 leading-tight">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="font-sans font-bold text-stone-800 text-2xl">
              NPR {product.priceInside.toLocaleString()}
            </div>
            <div className="h-6 w-px bg-stone-300" />
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-stone-800">5.0</span>
            </div>
          </div>

          <p className="text-stone-600 leading-relaxed mb-8 text-lg font-light">
            {product.description}
          </p>

          <div className="space-y-4 mb-10">
            {product.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-stone-700">{feat}</span>
              </div>
            ))}
          </div>

          <ProductActions product={product} />
          
          <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3 border border-amber-100 mt-8">
             <Truck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
             <div className="text-sm text-stone-700">
               <span className="font-bold block text-stone-900 mb-1">Cash on Delivery Available</span>
               Free shipping on orders over NPR {config.freeDeliveryThreshold.toLocaleString()} inside Kathmandu Valley.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
