'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceInside: number;
  priceOutside: number;
  originalPrice?: number | null;
  category: string;
  images: string[];
  features: string[];
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

interface LocationContextType {
  isInsideValley: boolean;
  toggleLocation: () => void;
  setInsideValley: (isInside: boolean) => void;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const LocationContext = createContext<LocationContextType | null>(null);
const CartContext = createContext<CartContextType | null>(null);

export const Providers = ({ children }: { children?: React.ReactNode }) => {
  const [isInsideValley, setInsideValleyState] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('lm_cart');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem('lm_cart', JSON.stringify(items));
  }, [items, mounted]);

  const toggleLocation = () => setInsideValleyState(prev => !prev);
  const setInsideValley = (val: boolean) => setInsideValleyState(val);

  const addToCart = (product: Product, quantity: number) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => setItems(prev => prev.filter(item => item.id !== id));
  
  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const clearCart = () => setItems([]);

  const cartTotal = items.reduce((sum, item) => {
    const price = isInsideValley ? item.priceInside : item.priceOutside;
    return sum + (price * item.quantity);
  }, 0);

  if (!mounted) return null;

  return (
    <LocationContext.Provider value={{ isInsideValley, toggleLocation, setInsideValley }}>
      <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, isCartOpen, setIsCartOpen }}>
        {children}
      </CartContext.Provider>
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext missing");
  return ctx;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart missing");
  return ctx;
};