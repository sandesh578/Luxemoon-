import { Check, MessageCircle, ArrowRight, Package } from 'lucide-react';
import Link from 'next/link';

export default async function OrderConfirmation({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;

  return (
    <div className="max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center pt-20 pb-20 px-4 text-center animate-fade-in-up">
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 mb-4 tracking-tight">Order Confirmed</h1>
      <p className="text-stone-600 mb-8 max-w-md text-sm md:text-base leading-relaxed">
        Thank you for choosing Luxe Moon. Your order has been placed successfully. A confirmation email has been sent.
      </p>

      <div className="bg-stone-50 w-full rounded-3xl p-6 md:p-8 space-y-6 mb-8 border border-stone-100 shadow-sm">
        <div className="flex justify-between items-center border-b border-stone-200 pb-4">
          <span className="text-stone-500 font-medium">Order Number</span>
          <span className="font-mono font-bold text-stone-900 tracking-wider">#{id.split('-')[0].toUpperCase()}</span>
        </div>

        <div className="flex items-start gap-4 text-left">
          <div className="p-3 bg-white rounded-xl shadow-sm"><Package className="w-6 h-6 text-amber-600" /></div>
          <div>
            <h3 className="font-bold text-stone-900">Delivery Expectation</h3>
            <p className="text-xs text-stone-500 mt-1">Inside Valley: 1-2 days | Outside Valley: 3-5 days</p>
          </div>
        </div>

        <div className="flex items-start gap-4 text-left">
          <div className="p-3 bg-white rounded-xl shadow-sm"><MessageCircle className="w-6 h-6 text-[#25D366]" /></div>
          <div>
            <h3 className="font-bold text-stone-900">Need Help?</h3>
            <p className="text-xs text-stone-500 mt-1">Our support team is available on WhatsApp.</p>
            <a href="https://wa.me/9779800000000" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm font-bold text-[#25D366] hover:underline">Chat with us →</a>
          </div>
        </div>
      </div>

      <Link href="/shop" className="group flex items-center justify-center gap-2 w-full md:w-auto px-8 py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10">
        Continue Shopping <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}