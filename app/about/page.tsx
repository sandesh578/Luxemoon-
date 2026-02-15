import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Story | Luxe Moon',
  description: 'Luxe Moon - Bringing Korean haircare innovation to Nepal. Formulated with premium botanicals like Argan Oil, Biotin, and Silk Proteins.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="font-serif text-5xl font-bold mb-8 text-stone-900">Our Story</h1>
      <p className="text-xl text-stone-600 leading-relaxed mb-12">
        Luxe Moon was born from a desire to bring the sophisticated technology of Korean haircare to the unique climate and needs of Nepal. 
        Our formulas are crafted in Seoul using premium botanicals like Argan Oil, Biotin, and Silk Proteins.
      </p>
      
      <div className="grid md:grid-cols-3 gap-8 mt-16 text-left">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-stone-100">
           <div className="text-4xl mb-4">🇰🇷</div>
           <h3 className="font-serif text-xl font-bold mb-2">Korean Roots</h3>
           <p className="text-stone-500">Formulated in top Seoul laboratories using cutting-edge Nanoplastia technology.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-stone-100">
           <div className="text-4xl mb-4">🇳🇵</div>
           <h3 className="font-serif text-xl font-bold mb-2">Nepali Soul</h3>
           <p className="text-stone-500">Designed specifically for the humidity, dust, and water conditions found in Nepal.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-stone-100">
           <div className="text-4xl mb-4">✨</div>
           <h3 className="font-serif text-xl font-bold mb-2">Glass Hair</h3>
           <p className="text-stone-500">Our signature finish. Achieve that mirror-like shine without heavy silicones.</p>
        </div>
      </div>
    </div>
  );
}