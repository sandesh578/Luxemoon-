'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Home, ShoppingBag, Info, Phone, User, Package, LogOut, X } from 'lucide-react';
import { optimizeImage } from '@/lib/image';
import type { ReactNode } from 'react';

type SessionState = {
  authenticated: boolean;
};

type MobileMenuDrawerProps = {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
  onLogout: () => void;
  session: SessionState;
  logoUrl?: string | null;
  storeName: string;
  links: Array<{ href: string; label: string }>;
  languageSwitcher?: ReactNode;
  currentPath?: string;
};

export function MobileMenuDrawer({
  open,
  onClose,
  onLogin,
  onLogout,
  session,
  logoUrl,
  storeName,
  links,
  languageSwitcher,
  currentPath,
}: MobileMenuDrawerProps) {
  const iconFor = (href: string) => {
    if (href === '/') return Home;
    if (href.startsWith('/shop')) return ShoppingBag;
    if (href.startsWith('/about')) return Info;
    if (href.startsWith('/contact')) return Phone;
    return ChevronRight;
  };

  return (
    <>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close mobile sidebar"
            onClick={onClose}
            className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]"
          />

          <aside
            className="md:hidden fixed top-0 left-0 h-full w-[85%] max-w-sm bg-gradient-to-b from-[#f8f3ef] to-[#efe7df] z-[120] flex flex-col shadow-xl overflow-x-hidden overflow-y-auto"
          >
            <div className="px-4 py-5 border-b border-stone-200/70">
              <div className="flex items-center justify-between">
                <Link href="/" onClick={onClose} className="flex items-center gap-3">
                  {logoUrl ? (
                    <Image src={optimizeImage(logoUrl)} alt={storeName} width={128} height={34} className="h-8 w-auto object-contain" />
                  ) : (
                    <span className="font-serif text-4xl tracking-tight text-[#3a2416]">{storeName}</span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="w-11 h-11 rounded-2xl border border-stone-300 bg-white/85 text-stone-800 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              <div>
                <p className="text-xs uppercase text-gray-400 tracking-wide mb-3">Navigation</p>
                <div className="space-y-3">
                  {links.map((link) => {
                    const Icon = iconFor(link.href);
                    const isActive = currentPath === link.href || (link.href !== '/' && (currentPath || '').startsWith(link.href));

                    return (
                      <div key={link.href}>
                        <Link
                          href={link.href}
                          onClick={onClose}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl bg-white/70 shadow-sm hover:bg-white transition active:scale-95 ${
                            isActive ? 'ring-1 ring-[#4a2f1d]/20' : ''
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-stone-500" />
                            <span className="text-[#3a2416] font-medium">{link.label}</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-stone-400" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase text-gray-400 tracking-wide mb-3">Account</p>
                {session.authenticated ? (
                  <div className="rounded-2xl border border-stone-200 bg-white/90 p-2 shadow-sm space-y-1">
                    <Link href="/account" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-stone-700 transition active:scale-95">
                      <User className="w-4 h-4 text-gray-500" />
                      Profile
                    </Link>
                    <Link href="/account/orders" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-stone-700 transition active:scale-95">
                      <Package className="w-4 h-4 text-gray-500" />
                      Orders
                    </Link>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-stone-700 transition active:scale-95"
                    >
                      <LogOut className="w-4 h-4 text-gray-500" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogin();
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#4a2f1d] text-white text-xs font-medium tracking-wide transition-all duration-300 hover:bg-[#3a2416] hover:scale-105 hover:shadow-md active:scale-95"
                  >
                    Login
                  </button>
                )}
              </div>

              {languageSwitcher ? (
                <div>
                  <p className="text-xs uppercase text-gray-400 tracking-wide mb-3">Language</p>
                  <div className="rounded-2xl border border-stone-200 bg-white/90 p-3 shadow-sm">
                    {languageSwitcher}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
