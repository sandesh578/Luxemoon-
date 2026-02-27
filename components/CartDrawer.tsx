'use client';
import { useCart, useLocationContext, useConfig } from './Providers';
import { X, ShoppingBag, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { optimizeImage } from '@/lib/image';

export const CartDrawer = () => {
  const { items, removeFromCart, updateQuantity, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const { isInsideValley } = useLocationContext();
  const config = useConfig();

  const remainingForFreeDelivery = Math.max(0, config.freeDeliveryThreshold - cartTotal);
  const progressPercent = Math.min(100, (cartTotal / config.freeDeliveryThreshold) * 100);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-5 border-b flex justify-between items-center bg-stone-50">
          <h2 className="font-serif text-xl font-bold text-stone-900">Your Bag ({items.length})</h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length > 0 && (
          <div className="bg-amber-50/50 p-4 border-b border-amber-100">
            <div className="flex justify-between text-[11px] font-bold text-amber-900 mb-2 uppercase tracking-wide">
              <span>{remainingForFreeDelivery > 0 ? `Add NPR ${remainingForFreeDelivery.toLocaleString()} for free delivery` : '🎉 You unlocked free delivery!'}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 w-full bg-amber-200/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {remainingForFreeDelivery === 0 && (
              <p className="text-[10px] text-amber-700 mt-2 font-medium">You are saving NPR {isInsideValley ? config.deliveryChargeInside : config.deliveryChargeOutside} on delivery fees!</p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <ShoppingBag className="w-16 h-16 text-stone-200" />
              <p className="text-stone-500 font-medium">Your bag is empty.</p>
              <Link href="/shop" onClick={() => setIsCartOpen(false)} className="px-6 py-2 border-2 border-amber-600 text-amber-700 rounded-xl hover:bg-amber-50">
                Start Shopping
              </Link>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4 group">
                <div className="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={optimizeImage(item.images[0])} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-bold text-stone-900 truncate pr-4">{item.name}</h3>
                    <p className="text-xs text-stone-500 uppercase tracking-wide">{item.category}</p>
                    {item.stock < 5 && item.stock > 0 && (
                      <p className="text-[10px] font-bold text-red-600 mt-0.5">Only {item.stock} left in stock</p>
                    )}
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex items-center border border-stone-200 rounded-lg bg-white">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:text-amber-600 disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:text-amber-600 disabled:opacity-30"
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-stone-900">
                        NPR {((isInsideValley ? item.priceInside : item.priceOutside) * item.quantity).toLocaleString()}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[10px] text-red-500 hover:text-red-700 underline mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-stone-50 border-t border-stone-100 space-y-4">
            <div className="flex justify-between text-lg font-bold text-stone-900">
              <span>Subtotal</span>
              <span>NPR {cartTotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-stone-500 text-center">Shipping calculated at checkout.</p>
            <Link
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="w-full block text-center px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg font-bold"
            >
              CHECKOUT NOW
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};