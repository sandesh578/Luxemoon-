import React from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard, ShoppingBag, Settings, UserX, MessageSquare } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-100 flex">
      <aside className="w-64 bg-stone-900 text-stone-400 p-6 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="font-serif text-white text-xl font-bold mb-10 tracking-widest">LUXE MOON</div>
        <nav className="space-y-2 flex-1">
          <NavItem href="/admin" icon={<LayoutDashboard />} label="Orders" />
          <NavItem href="/admin/products" icon={<ShoppingBag />} label="Products" />
          <NavItem href="/admin/reviews" icon={<MessageSquare />} label="Reviews" />
          <NavItem href="/admin/customers" icon={<UserX />} label="Blacklist" />
          <NavItem href="/admin/settings" icon={<Settings />} label="Settings" />
        </nav>
        <Link href="/" className="flex items-center gap-3 text-stone-500 hover:text-white transition-colors p-3">
          <LogOut className="w-4 h-4" /> 
          <span className="font-medium">Exit</span>
        </Link>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
    >
      {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
