import Link from 'next/link';

export default function Home() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-stone-900">
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1519699047748-40baea614fee?q=80&w=2574&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-60"
          alt="Luxury Hair Model"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-90" />
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        <div className="flex justify-center">
          <span className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase">
            Official Launch in Nepal
          </span>
        </div>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-[#F6EFE7] leading-[1.1]">
          Rooted in Korea.<br/>
          <span className="text-amber-500 italic">Created for You.</span>
        </h1>
        <p className="text-stone-300 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
          Experience the glass-hair revolution. Professional Nanoplastia treatment formulated with premium botanicals.
        </p>
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop" className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold shadow-lg hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all">
            SHOP COLLECTION
          </Link>
          <Link href="/about" className="px-6 py-3.5 rounded-2xl border-2 border-stone-400 text-stone-200 font-bold hover:bg-white/5 hover:border-white hover:text-white transition-all">
            OUR STORY
          </Link>
        </div>
      </div>
    </section>
  );
}