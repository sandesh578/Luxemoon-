'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, ShoppingBag, Settings, UserX, MessageSquare, Grid, Home, Menu, X, Shield, ShoppingCart, Mail } from 'lucide-react';
import { Toaster } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Login page: render without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const NavLinks = () => (
    <>
      <NavItem href="/admin" icon={<LayoutDashboard />} label="Orders" onClick={() => setMobileMenuOpen(false)} pathname={pathname} />
      <NavItem href="/admin/products" icon={<ShoppingBag />} label="Products" onClick={() => setMobileMenuOpen(false)} pathname={pathname} />
      <NavItem href="/admin/categories" icon={<Grid />} label="Categories" onClick={() => setMobileMenuOpen(false)} pathname={pathname} />
      <NavItem href="/admin/coupons" icon={<ShoppingCart />} label="Promo Codes" onClick={() => setMobileMenuOpen(false)} pathname={pathname} />
      <NavItem href="/admin/reviews" icon={<MessageSquare />} label="Reviews" onClick={() => setMobileMenuOpen(false)} pathname={pathname} />
      <NavItem href="/admin/messages" icon={<Mail />} label="Messages" onClick={() => setMobileMenuOpen(false)} pathname={pathname} />
      <NavItem href="/admin/transformations" icon={<Shield />} label="Results" onClick={() => setMobileMenuOpen(false)} pathname={pathname} />
      <NavItem href="/admin/customers" icon={<UserX />} label="Blacklist" onClick={() => setMobileMenuOpen(false)} pathname={pathname} />
      <NavItem href="/admin/homepage" icon={<Home />} label="Homepage" onClick={() => setMobileMenuOpen(false)} pathname={pathname} />
      <NavItem href="/admin/settings" icon={<Settings />} label="Settings" onClick={() => setMobileMenuOpen(false)} pathname={pathname} />
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-stone-100 flex flex-col md:flex-row overflow-x-hidden w-full max-w-[100vw]">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-stone-900 text-white p-4 flex items-center justify-between sticky top-0 z-[60] w-full">
        <div className="font-serif text-lg font-bold tracking-widest text-[#F6EFE7]">ADMIN PANEL</div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -mr-2 text-stone-400 hover:text-white">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)}>
          {/* Drawer Panel */}
          <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-stone-900 text-stone-400 p-6 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-800">
              <div className="font-serif text-white text-xl font-bold tracking-widest">LUXE MOON</div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-2 flex-1 overflow-y-auto pr-2 no-scrollbar">
              <NavLinks />
            </nav>
            <Link href="/" className="flex items-center gap-3 text-stone-500 hover:text-white transition-colors p-3 mt-4 border-t border-stone-800 pt-4">
              <LogOut className="w-5 h-5" />
              <span className="font-bold">Exit Admin</span>
            </Link>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-400 p-6 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="font-serif text-white text-xl font-bold mb-10 tracking-widest">LUXE MOON</div>
        <nav className="space-y-2 flex-1 overflow-y-auto">
          <NavLinks />
        </nav>
        <Link href="/" className="flex items-center gap-3 text-stone-500 hover:text-white transition-colors p-3">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Exit</span>
        </Link>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
        <Toaster position="bottom-right" richColors />
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, onClick, pathname }: { href: string, icon: React.ReactNode, label: string, onClick?: () => void, pathname: string }) {
  const isActive = pathname === href || (pathname.startsWith(href) && href !== '/admin');

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-bold ${isActive ? 'bg-[#F6EFE7]/10 text-[#F6EFE7]' : 'hover:bg-white/5 hover:text-white'}`}
    >
      {React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })
        : icon}
      <span>{label}</span>
    </Link>
  );
}
