'use client';
import { Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react';
import Link from 'next/link';
import { useConfig } from './Providers';

export const Footer = () => {
  const config = useConfig();

  return (
    <footer className="bg-stone-900 text-stone-300 py-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <h3 className="font-serif text-2xl text-white">{config.storeName}</h3>
          <p className="text-sm font-light leading-relaxed text-stone-400 max-w-xs">
            Premium Korean-origin haircare. Formulated with Biotin & Keratin to restore your hair's natural brilliance.
          </p>
          <div className="flex gap-4 pt-2">
            <Instagram className="w-5 h-5 hover:text-amber-500 cursor-pointer" />
            <Facebook className="w-5 h-5 hover:text-amber-500 cursor-pointer" />
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Shop</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/shop" className="hover:text-amber-500 transition-colors">All Products</Link></li>
            <li><Link href="/shop" className="hover:text-amber-500 transition-colors">Nanoplastia Kits</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Support</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-amber-500 transition-colors">Track Order</a></li>
            <li><Link href="/admin/login" className="hover:text-amber-500 transition-colors">Admin Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-amber-600" />
              <span>{config.contactPhone}</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-amber-600" />
              <span>{config.contactEmail}</span>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>{config.contactAddress}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-stone-800 text-center text-xs text-stone-500">
        &copy; {new Date().getFullYear()} {config.storeName} Nepal. All rights reserved.
      </div>
    </footer>
  );
};
