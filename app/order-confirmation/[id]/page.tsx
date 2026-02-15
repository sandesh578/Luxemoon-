import { Check } from 'lucide-react';
import Link from 'next/link';

export default async function OrderConfirmation({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center animate-fade-in-up">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
        <Check className="w-12 h-12" />
      </div>
      <h1 className="font-serif text-4xl font-bold text-stone-900 mb-4">Order Placed!</h1>
      <p className="text-stone-600 mb-2">Order ID: <span className="font-mono font-bold text-stone-800">{id}</span></p>
      <p className="text-stone-600 mb-8 max-w-md">
        Thank you for choosing Luxe Moon. We will contact you shortly to confirm your order and delivery details.
      </p>
      <Link href="/" className="px-6 py-3 border-2 border-amber-600 text-amber-700 rounded-xl font-bold hover:bg-amber-50">
        Back to Home
      </Link>
    </div>
  );
}