import type { Metadata } from 'next';
import { Phone, Mail, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us | Luxe Moon',
  description: 'Get in touch with Luxe Moon Nepal for support, inquiries, or bulk orders.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="font-serif text-4xl font-bold mb-12 text-center text-stone-900">Contact Us</h1>
      <div className="grid md:grid-cols-3 gap-8 text-center">
        <div className="p-8 bg-white rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
            <Phone className="w-10 h-10 mx-auto text-amber-600 mb-6" />
            <h3 className="font-bold text-lg mb-2 text-stone-900">Phone & WhatsApp</h3>
            <p className="text-stone-600">+977 9800000000</p>
            <p className="text-xs text-stone-400 mt-2">Sun-Fri, 10am - 6pm</p>
        </div>
        <div className="p-8 bg-white rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
            <Mail className="w-10 h-10 mx-auto text-amber-600 mb-6" />
            <h3 className="font-bold text-lg mb-2 text-stone-900">Email</h3>
            <p className="text-stone-600">hello@luxemoon.com.np</p>
            <p className="text-xs text-stone-400 mt-2">We reply within 24h</p>
        </div>
        <div className="p-8 bg-white rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
            <MapPin className="w-10 h-10 mx-auto text-amber-600 mb-6" />
            <h3 className="font-bold text-lg mb-2 text-stone-900">Office</h3>
            <p className="text-stone-600">Durbarmarg</p>
            <p className="text-xs text-stone-400 mt-2">Kathmandu, Nepal</p>
        </div>
      </div>
    </div>
  );
}