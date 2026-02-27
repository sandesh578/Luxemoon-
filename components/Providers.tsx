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
  videoUrl?: string | null;
  sku?: string | null;
  discountPercent?: number;
  discountFixed?: number | null;
  discountStart?: string | null;
  discountEnd?: string | null;
  isFeatured?: boolean;
  isNew?: boolean;
  tags?: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SiteConfig {
  storeName: string;
  bannerText: string;
  logoUrl?: string | null;
  deliveryChargeInside: number;
  deliveryChargeOutside: number;
  freeDeliveryThreshold: number;
  codFee: number;
  expressDeliveryEnabled: boolean;
  estimatedDeliveryInside: string;
  estimatedDeliveryOutside: string;
  globalDiscountPercent: number;
  globalDiscountStart?: string | null;
  globalDiscountEnd?: string | null;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  whatsappNumber?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  footerContent?: string | null;
  privacyPolicy?: string | null;
  termsConditions?: string | null;
  aboutContent?: string | null;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  noticeBarEnabled?: boolean;
  noticeBarText?: string | null;
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
  deliveryCharge: number;
  finalTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

interface ConfigContextType {
  config: SiteConfig;
}

const LocationContext = createContext<LocationContextType | null>(null);
const CartContext = createContext<CartContextType | null>(null);
const ConfigContext = createContext<ConfigContextType | null>(null);

export const Providers = ({ children, config }: { children?: React.ReactNode, config: SiteConfig }) => {
  const [isInsideValley, setInsideValleyState] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lm_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        localStorage.removeItem('lm_cart');
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem('lm_cart', JSON.stringify(items));
  }, [items, hydrated]);

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

  const deliveryCharge = cartTotal >= config.freeDeliveryThreshold
    ? 0
    : (isInsideValley ? config.deliveryChargeInside : config.deliveryChargeOutside);

  const finalTotal = cartTotal + deliveryCharge;

  return (
    <ConfigContext.Provider value={{ config }}>
      <LocationContext.Provider value={{ isInsideValley, toggleLocation, setInsideValley }}>
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, deliveryCharge, finalTotal, isCartOpen, setIsCartOpen }}>
          {children}
        </CartContext.Provider>
      </LocationContext.Provider>
    </ConfigContext.Provider>
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

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig missing");
  return ctx.config;
};
