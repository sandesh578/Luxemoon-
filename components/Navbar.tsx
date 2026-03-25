'use client';
import Link from 'next/link';
import { Menu, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { optimizeImage } from '@/lib/image';
import { useCart, useConfig, useI18n } from './Providers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/lib/currency';
import { ProfileDropdown } from './ProfileDropdown';
import { useRouter } from 'next/navigation';

const CartDrawer = dynamic(
  () => import('./CartDrawer').then((mod) => mod.CartDrawer),
  { ssr: false }
);
const MobileMenuDrawer = dynamic(
  () => import('./MobileMenuDrawer').then((mod) => mod.MobileMenuDrawer),
  { ssr: false }
);

type SessionState = {
  authenticated: boolean;
  user?: {
    userId?: string;
    email?: string;
    name?: string;
  };
};

export const Navbar = () => {
  const { items, setIsCartOpen, cartTotal } = useCart();
  const rawConfig = useConfig();
  const { t } = useI18n();
  const config = rawConfig as import('./Providers').SiteConfig;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [session, setSession] = useState<SessionState>({ authenticated: false });
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = (await response.json()) as SessionState;
      setSession(data?.authenticated ? data : { authenticated: false });
    } catch {
      setSession({ authenticated: false });
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    fetchSession();
  }, [pathname, fetchSession]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const applyMatch = () => setIsMobileViewport(media.matches);
    applyMatch();

    media.addEventListener('change', applyMatch);
    return () => media.removeEventListener('change', applyMatch);
  }, []);

  useEffect(() => {
    if (!isMobileViewport) return;
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen, isMobileViewport]);

  const userInitials = useMemo(() => {
    const name = session.user?.name?.trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [session.user?.name]);

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const menuLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/shop', label: t('nav.shop') },
    { href: '/about', label: t('nav.ourStory') },
    { href: '/contact', label: t('nav.contact') },
  ];

  const handleMobileLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setMobileOpen(false);
      router.push('/');
      router.refresh();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full flex flex-col">
        {config.noticeBarEnabled && config.noticeBarText && (
          <div className="bg-stone-900 text-amber-50 text-[10px] md:text-sm font-bold tracking-widest text-center py-2.5 px-4 uppercase overflow-hidden relative group">
            <div className={`whitespace-nowrap inline-block ${!config.noticeBarStill ? 'animate-marquee' : ''}`}>
              <span className="inline-flex gap-8 items-center px-4">
                {config.noticeBarText}
                {!config.noticeBarStill && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    {config.noticeBarText}
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    {config.noticeBarText}
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  </>
                )}
              </span>
            </div>
          </div>
        )}
        <nav className="bg-[#F6EFE7]/90 backdrop-blur-xl border-b border-amber-900/5 z-[100]">
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
                <Link href="/" className="hover:text-amber-700 transition-colors">{t('nav.home').toUpperCase()}</Link>
                <Link href="/shop" className="hover:text-amber-700 transition-colors">{t('nav.shop').toUpperCase()}</Link>
                <Link href="/about" className="hover:text-amber-700 transition-colors">{t('nav.ourStory').toUpperCase()}</Link>
                <Link href="/contact" className="hover:text-amber-700 transition-colors">{t('nav.contact').toUpperCase()}</Link>
              </div>

              <div className="flex items-center gap-4 sm:gap-5">
                {config.languageToggleEnabled && (
                  <div className="hidden sm:block">
                    <LanguageSwitcher />
                  </div>
                )}

                <div className="relative" onMouseLeave={() => !isMobileViewport && setProfileOpen(false)}>
                  {!session.authenticated ? (
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="px-4 py-2 rounded-full border border-gray-300 text-sm hover:bg-gray-100 transition"
                    >
                      Login
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setProfileOpen((prev) => !prev)}
                      onMouseEnter={() => !isMobileViewport && setProfileOpen(true)}
                      aria-label="Open profile menu"
                      className="hover:scale-105 transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-stone-800 text-white flex items-center justify-center font-medium">
                        {userInitials}
                      </div>
                    </button>
                  )}

                  {session.authenticated && (
                    <ProfileDropdown
                      open={profileOpen}
                      onClose={() => setProfileOpen(false)}
                      isMobile={isMobileViewport}
                    />
                  )}
                </div>

                <button onClick={() => setIsCartOpen(true)} className="relative group" aria-label="Open cart">
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

        </nav>
      </header>
      <MobileMenuDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogin={() => router.push('/login')}
        onLogout={handleMobileLogout}
        session={session}
        logoUrl={config.logoUrl}
        storeName={config.storeName}
        links={menuLinks}
        languageSwitcher={config.languageToggleEnabled ? <LanguageSwitcher /> : null}
        currentPath={pathname}
      />
      <CartDrawer />

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
              {formatCurrency(cartTotal, config.currencyCode)} <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </button>
        </div>
      )}
    </>
  );
};
