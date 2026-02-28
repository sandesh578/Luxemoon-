'use client';
import Link from 'next/link';
import { Menu, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { optimizeImage } from '@/lib/image';
import { useCart, useConfig, useI18n } from './Providers';
import { CartDrawer } from './CartDrawer';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar = () => {
  const { items, setIsCartOpen, cartTotal } = useCart();
  const rawConfig = useConfig();
  const { t } = useI18n();
  const config = rawConfig as import('./Providers').SiteConfig;
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full flex flex-col">
        {config.noticeBarEnabled && config.noticeBarText && (
          <div className="bg-stone-900 text-amber-50 text-[10px] md:text-sm font-bold tracking-widest text-center py-2.5 px-4 uppercase animate-fade-in">
            <span className="inline-flex gap-2 items-center">
              {config.noticeBarText}
            </span>
          </div>
        )}
        <nav className="bg-[#F6EFE7]/90 backdrop-blur-xl border-b border-amber-900/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">

              <div className="flex items-center gap-4">
                <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-stone-800">
                  <Menu className="w-6 h-6" />
                </button>
                <Link href="/" className="flex items-center gap-3">
                  {config.logoUrl ? (
                    <Image src={optimizeImage(config.logoUrl)} alt={config.storeName} width={160} height={40} className="h-10 w-auto object-contain" />
                  ) : (
                    <div className="flex flex-col">
                      <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tighter uppercase">{config.storeName}</h1>
                      <span className="text-[9px] tracking-[0.25em] uppercase text-amber-700 font-bold">{t('nav.rootedInKorea')}</span>
                    </div>
                  )}
                </Link>
              </div>

              <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600 tracking-wide">
                <Link href="/" prefetch={false} className="hover:text-amber-700 transition-colors">{t('nav.home').toUpperCase()}</Link>
                <Link href="/shop" prefetch={false} className="hover:text-amber-700 transition-colors">{t('nav.shop').toUpperCase()}</Link>
                <Link href="/about" prefetch={false} className="hover:text-amber-700 transition-colors">{t('nav.ourStory').toUpperCase()}</Link>
                <Link href="/contact" prefetch={false} className="hover:text-amber-700 transition-colors">{t('nav.contact').toUpperCase()}</Link>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden sm:block">
                  <LanguageSwitcher />
                </div>

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
              <Link href="/" onClick={() => setMobileOpen(false)} className="block font-serif text-xl">{t('nav.home')}</Link>
              <Link href="/shop" onClick={() => setMobileOpen(false)} className="block font-serif text-xl">{t('nav.shop')}</Link>
              <Link href="/about" onClick={() => setMobileOpen(false)} className="block font-serif text-xl">{t('nav.ourStory')}</Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="block font-serif text-xl">{t('nav.contact')}</Link>
              <div className="pt-2">
                <LanguageSwitcher />
              </div>
            </div>
          )}
        </nav>
      </header>
      <CartDrawer />

      {/* Sticky Mobile Cart Bar */}
      {itemCount > 0 && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 bg-stone-900 text-white font-bold rounded-xl flex items-center justify-between px-5 shadow-2xl border border-stone-800 animate-slide-in-bottom"
          >
            <span className="flex items-center gap-2 text-sm tracking-wide">
              <ShoppingBag className="w-4 h-4" /> {itemCount} {itemCount > 1 ? t('common.items') : t('common.item')}
            </span>
            <span className="flex items-center gap-2 text-sm">
              {t('common.currency')} {cartTotal.toLocaleString()} <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </button>
        </div>
      )}
    </>
  );
};
