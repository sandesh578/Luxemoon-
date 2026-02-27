'use client';
import { Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react';
import Link from 'next/link';
import { useConfig } from './Providers';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { optimizeImage } from '@/lib/image';

export const Footer = () => {
  const config = useConfig();
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-stone-900 text-stone-300 py-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          {config.logoUrl ? (
            <Image src={optimizeImage(config.logoUrl)} alt={config.storeName} width={120} height={32} className="h-8 w-auto object-contain brightness-0 invert" />
          ) : (
            <h3 className="font-serif text-2xl text-white">{config.storeName}</h3>
          )}
          <p className="text-sm font-light leading-relaxed text-stone-400 max-w-xs">
            {config.footerContent || 'Premium Korean-origin haircare. Formulated with Biotin & Keratin to restore your hair\'s natural brilliance.'}
          </p>
          <div className="flex gap-4 pt-2">
            {config.instagramUrl ? (
              <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer"><Instagram className="w-5 h-5 hover:text-amber-500 cursor-pointer" /></a>
            ) : (
              <Instagram className="w-5 h-5 hover:text-amber-500 cursor-pointer" />
            )}
            {config.facebookUrl ? (
              <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer"><Facebook className="w-5 h-5 hover:text-amber-500 cursor-pointer" /></a>
            ) : (
              <Facebook className="w-5 h-5 hover:text-amber-500 cursor-pointer" />
            )}
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Shop</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/shop" prefetch={false} className="hover:text-amber-500 transition-colors">All Products</Link></li>
            <li><Link href="/shop" prefetch={false} className="hover:text-amber-500 transition-colors">Nanoplastia Kits</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Support</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/about" prefetch={false} className="hover:text-amber-500 transition-colors">Our Story</Link></li>
            <li><Link href="/delivery-policy" prefetch={false} className="hover:text-amber-500 transition-colors">Delivery Policy</Link></li>
            <li><Link href="/refund-policy" prefetch={false} className="hover:text-amber-500 transition-colors">Refund Policy</Link></li>
            <li><Link href="/privacy" prefetch={false} className="hover:text-amber-500 transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" prefetch={false} className="hover:text-amber-500 transition-colors">Terms & Conditions</Link></li>
            <li><Link href="/contact" prefetch={false} className="hover:text-amber-500 transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li>
              <a href={`tel:${config.contactPhone?.replace(/[^0-9+]/g, '')}`} className="flex items-start gap-3 hover:text-amber-500 transition-colors group">
                <Phone className="w-5 h-5 text-amber-600 mt-0.5 group-hover:scale-110 transition-transform" />
                <span>{config.contactPhone}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${config.contactEmail}`} className="flex items-start gap-3 hover:text-amber-500 transition-colors group">
                <Mail className="w-5 h-5 text-amber-600 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="break-all">{config.contactEmail}</span>
              </a>
            </li>
            <li>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.contactAddress || '')}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-amber-500 transition-colors group">
                <MapPin className="w-5 h-5 text-amber-600 mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="leading-relaxed">{config.contactAddress}</span>
              </a>
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
