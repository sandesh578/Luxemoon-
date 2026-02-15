'use client';
import Link from 'next/link';
import { Menu, ShoppingBag, MapPin } from 'lucide-react';
import { useCart, useLocationContext, useConfig } from './Providers';
import { CartDrawer } from './CartDrawer';
import { useState } from 'react';

export const Navbar = () => {
  const { items, setIsCartOpen } = useCart();
  const { isInsideValley, toggleLocation } = useLocationContext();
  const config = useConfig();
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <div className="bg-stone-900 text-amber-50 text-[10px] md:text-xs font-bold tracking-widest text-center py-2 px-4 uppercase">
        ✨ {config.bannerText} ✨
      </div>
      <nav className="sticky top-0 z-40 bg-[#F6EFE7]/90 backdrop-blur-xl border-b border-amber-900/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-stone-800">
                <Menu className="w-6 h-6" />
              </button>
              <Link href="/" className="flex flex-col">
                <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tighter uppercase">{config.storeName}</h1>
                <span className="text-[9px] tracking-[0.25em] uppercase text-amber-700 font-bold">Rooted in Korea</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600 tracking-wide">
              <Link href="/" className="hover:text-amber-700 transition-colors">HOME</Link>
              <Link href="/shop" className="hover:text-amber-700 transition-colors">SHOP</Link>
              <Link href="/about" className="hover:text-amber-700 transition-colors">OUR STORY</Link>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={toggleLocation}
                className="hidden md:flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 hover:bg-amber-100 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                {isInsideValley ? 'KTM Valley' : 'Outside Valley'}
              </button>

              <button onClick={() => setIsCartOpen(true)} className="relative group">
                <div className="p-2 text-stone-800 group-hover:text-amber-700 transition-colors">
                  <ShoppingBag className="w-6 h-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-amber-600 rounded-full shadow-sm border border-[#F6EFE7]">
                      {itemCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {mobileOpen && (
          <div className="md:hidden bg-[#F6EFE7] border-b border-amber-900/10 p-4 space-y-4 shadow-xl">
            <Link href="/" onClick={() => setMobileOpen(false)} className="block font-serif text-xl">Home</Link>
            <Link href="/shop" onClick={() => setMobileOpen(false)} className="block font-serif text-xl">Shop</Link>
            <Link href="/about" onClick={() => setMobileOpen(false)} className="block font-serif text-xl">Our Story</Link>
          </div>
        )}
      </nav>
      <CartDrawer />
    </>
  );
};
