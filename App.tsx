import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  ShoppingBag, Menu, X, Star, Check, Truck, ShieldCheck, MapPin, 
  ChevronRight, Minus, Plus, Trash2, Package, Users, Settings, 
  ArrowLeft, Search, Camera, Phone, Mail, Instagram, Facebook, LogOut,
  Edit2, Save, Upload, User, Share2, Link as LinkIcon, MessageCircle
} from 'lucide-react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Product, CartItem, Order, OrderStatus, Review, PROVINCES, SiteConfig, CATEGORIES } from './types';
import * as db from './services/mockDb';

// --- Global Config Context ---
interface GlobalConfigContextType {
  config: SiteConfig;
  refreshConfig: () => void;
}
const GlobalConfigContext = createContext<GlobalConfigContextType | null>(null);

// --- Location Context ---
interface LocationContextType {
  isInsideValley: boolean;
  toggleLocation: () => void;
  setInsideValley: (isInside: boolean) => void;
}
const LocationContext = createContext<LocationContextType | null>(null);

// --- Cart Context ---
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
const CartContext = createContext<CartContextType | null>(null);

// --- Providers ---

const AppProviders = ({ children }: { children?: React.ReactNode }) => {
  const [config, setConfig] = useState<SiteConfig>(db.getConfig());
  const [isInsideValley, setInsideValleyState] = useState(true);
  
  // Initialize cart from localStorage
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('lm_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Cart load error", e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('lm_cart', JSON.stringify(items));
  }, [items]);

  const refreshConfig = () => setConfig(db.getConfig());
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

  // Calculate total
  const cartTotal = items.reduce((sum, item) => {
    const price = isInsideValley ? item.priceInside : item.priceOutside;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <GlobalConfigContext.Provider value={{ config, refreshConfig }}>
      <LocationContext.Provider value={{ isInsideValley, toggleLocation, setInsideValley }}>
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, isCartOpen, setIsCartOpen }}>
          {children}
        </CartContext.Provider>
      </LocationContext.Provider>
    </GlobalConfigContext.Provider>
  );
};

// --- Hooks ---

const useConfig = () => {
  const ctx = useContext(GlobalConfigContext);
  if (!ctx) throw new Error("useConfig missing");
  return ctx;
};

const useLocationContext = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext missing");
  return ctx;
};

const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart missing");
  return ctx;
};

const useScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
};

// --- SEO & Metadata Component ---
// In a real Next.js app, this would be replaced by export const metadata or generateMetadata
interface SeoProps {
  title: string;
  description?: string;
  image?: string;
  type?: string;
  price?: number;
}

const Seo = ({ title, description, image, type = 'website', price }: SeoProps) => {
  const location = useLocation();
  const fullUrl = `${window.location.origin}${location.pathname}`;

  useEffect(() => {
    // Update Title
    document.title = `${title} | Luxe Moon`;

    // Helper to update or create meta tags
    const updateMeta = (name: string, content: string, attribute = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Meta
    if (description) updateMeta('description', description);

    // Open Graph
    updateMeta('og:title', title, 'property');
    if (description) updateMeta('og:description', description, 'property');
    if (image) updateMeta('og:image', image, 'property');
    updateMeta('og:url', fullUrl, 'property');
    updateMeta('og:type', type, 'property');
    updateMeta('og:site_name', 'Luxe Moon Haircare', 'property');
    
    if (price) {
      updateMeta('product:price:amount', price.toString(), 'property');
      updateMeta('product:price:currency', 'NPR', 'property');
    }

    // Twitter
    updateMeta('twitter:card', 'summary_large_image', 'name');
    updateMeta('twitter:title', title, 'name');
    if (description) updateMeta('twitter:description', description, 'name');
    if (image) updateMeta('twitter:image', image, 'name');
    
    // Canonical
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', fullUrl);

  }, [title, description, image, fullUrl, type, price]);

  return null;
};

// --- UI Components ---

const PriceDisplay = ({ product, className = "" }: { product: Product, className?: string }) => {
  const { isInsideValley } = useLocationContext();
  const price = isInsideValley ? product.priceInside : product.priceOutside;
  
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className="font-sans font-bold text-stone-800">
        NPR {price.toLocaleString()}
      </span>
      {product.originalPrice && (
        <span className="text-sm text-stone-400 line-through font-sans">
          NPR {product.originalPrice.toLocaleString()}
        </span>
      )}
    </div>
  );
};

const Button = ({ 
  children, variant = 'primary', className = '', fullWidth, ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', fullWidth?: boolean }) => {
  const base = "px-6 py-3.5 rounded-2xl transition-all duration-300 font-sans font-bold tracking-wide text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]";
  const variants = {
    primary: "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5",
    secondary: "bg-stone-800 text-white hover:bg-stone-900 shadow-md",
    outline: "border-2 border-amber-600 text-amber-700 hover:bg-amber-50",
    ghost: "text-stone-600 hover:text-amber-700 hover:bg-stone-100/50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
  };

  return (
    <button className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
};

const ShareButtons = ({ product }: { product: Product }) => {
  const [copied, setCopied] = useState(false);
  const { isInsideValley } = useLocationContext();
  const price = isInsideValley ? product.priceInside : product.priceOutside;
  
  // Use window.location to get the exact current URL (including updated routing)
  const productUrl = window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleWhatsApp = () => {
    const text = `Check out this ${product.name} from Luxe Moon!\nPrice: NPR ${price.toLocaleString()}\n${productUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-stone-100">
      <Button 
        variant="outline" 
        onClick={handleWhatsApp} 
        className="flex-1 !border-green-500 !text-green-600 hover:!bg-green-50"
      >
        <MessageCircle className="w-4 h-4" /> Share on WhatsApp
      </Button>
      <Button 
        variant="outline" 
        onClick={handleCopy}
        className={`flex-1 transition-colors ${copied ? '!bg-stone-800 !text-white !border-stone-800' : ''}`}
      >
        {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
        {copied ? 'Link Copied!' : 'Copy Link'}
      </Button>
    </div>
  );
};

const Input = ({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string, error?: string }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">{label}</label>
    <input 
      className={`p-3 bg-white border ${error ? 'border-red-500 bg-red-50' : 'border-stone-200'} rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-stone-300 font-sans`}
      {...props}
    />
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
);

// --- Layouts ---

const AnnouncementBar = () => {
  const { config } = useConfig();
  return (
    <div className="bg-stone-900 text-amber-50 text-[10px] md:text-xs font-bold tracking-widest text-center py-2 px-4 uppercase">
      {config.bannerText}
    </div>
  );
};

const CartDrawer = () => {
  const { items, removeFromCart, updateQuantity, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const { isInsideValley } = useLocationContext();
  const navigate = useNavigate();

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

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <ShoppingBag className="w-16 h-16 text-stone-200" />
              <p className="text-stone-500 font-medium">Your bag is empty.</p>
              <Button onClick={() => { setIsCartOpen(false); navigate('/shop'); }} variant="outline">
                Start Shopping
              </Button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4 group">
                <div className="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-bold text-stone-900 truncate pr-4">{item.name}</h3>
                    <p className="text-xs text-stone-500 uppercase tracking-wide">{item.category}</p>
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
            <Button 
              fullWidth 
              onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}
            >
              CHECKOUT NOW
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const Navbar = () => {
  const { items, setIsCartOpen } = useCart();
  const { isInsideValley, toggleLocation } = useLocationContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <AnnouncementBar />
      <nav className="sticky top-0 z-40 bg-[#F6EFE7]/90 backdrop-blur-xl border-b border-amber-900/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-stone-800">
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/" className="flex flex-col">
                <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tighter">LUXE MOON</h1>
                <span className="text-[9px] tracking-[0.25em] uppercase text-amber-700 font-bold">Rooted in Korea</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600 tracking-wide">
              <Link to="/" className="hover:text-amber-700 transition-colors">HOME</Link>
              <Link to="/shop" className="hover:text-amber-700 transition-colors">SHOP</Link>
              <Link to="/about" className="hover:text-amber-700 transition-colors">OUR STORY</Link>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={toggleLocation}
                className="hidden md:flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 hover:bg-amber-100 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                {isInsideValley ? 'KTM Valley' : 'Outside Valley'}
              </button>

              <button onClick={() => setIsCartOpen(true)} className="relative group">
                <div className="p-2 text-stone-800 group-hover:text-amber-700 transition-colors">
                  <ShoppingBag className="w-6 h-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-amber-600 rounded-full shadow-sm border border-[#F6EFE7]">
                      {itemCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {mobileOpen && (
          <div className="md:hidden bg-[#F6EFE7] border-b border-amber-900/10 p-4 space-y-4 shadow-xl">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block font-serif text-xl">Home</Link>
            <Link to="/shop" onClick={() => setMobileOpen(false)} className="block font-serif text-xl">Shop</Link>
            <Link to="/about" onClick={() => setMobileOpen(false)} className="block font-serif text-xl">Our Story</Link>
            <div className="pt-4 border-t border-amber-900/10">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Pricing Location</span>
              <button 
                onClick={() => { toggleLocation(); setMobileOpen(false); }}
                className="mt-2 flex items-center gap-2 text-amber-700 font-bold"
              >
                <MapPin className="w-4 h-4" />
                {isInsideValley ? 'Inside Kathmandu Valley' : 'Outside Kathmandu Valley'}
              </button>
            </div>
          </div>
        )}
      </nav>
      <CartDrawer />
    </>
  );
};

const Footer = () => {
  const { config } = useConfig();
  return (
    <footer className="bg-stone-900 text-stone-300 py-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <h3 className="font-serif text-2xl text-white">LUXE MOON</h3>
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
            <li><Link to="/shop" className="hover:text-amber-500 transition-colors">All Products</Link></li>
            <li><Link to="/shop" className="hover:text-amber-500 transition-colors">Nanoplastia Kits</Link></li>
            <li><Link to="/shop" className="hover:text-amber-500 transition-colors">Serums & Oils</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Support</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-amber-500 transition-colors">Track Order</a></li>
            <li><Link to="/admin" className="hover:text-amber-500 transition-colors">Admin Login</Link></li>
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
              <span>{config.officeAddress}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-stone-800 text-center text-xs text-stone-500">
        &copy; {new Date().getFullYear()} Luxe Moon Nepal. All rights reserved.
      </div>
    </footer>
  );
};

// --- Pages ---

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-stone-900">
      <Seo 
        title="Premium Korean Haircare in Nepal" 
        description="Rooted in Korea, Created for You. Experience the glass-hair revolution with our Nanoplastia treatments."
        image="https://images.unsplash.com/photo-1519699047748-40baea614fee?q=80&w=2574&auto=format&fit=crop"
      />
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1519699047748-40baea614fee?q=80&w=2574&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-60"
          alt="Luxury Hair Model"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-90" />
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        <div className="flex justify-center">
          <span className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase">
            Official Launch in Nepal
          </span>
        </div>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-[#F6EFE7] leading-[1.1]">
          Rooted in Korea.<br/>
          <span className="text-amber-500 italic">Created for You.</span>
        </h1>
        <p className="text-stone-300 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
          Experience the glass-hair revolution. Professional Nanoplastia treatment formulated with premium botanicals.
        </p>
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/shop')} className="min-w-[200px] text-base">
            SHOP COLLECTION
          </Button>
          <Button variant="outline" onClick={() => navigate('/about')} className="min-w-[200px] text-base bg-transparent border-stone-400 text-stone-200 hover:border-white hover:text-white hover:bg-white/5">
            OUR STORY
          </Button>
        </div>
      </div>
    </section>
  );
};

const Shop = () => {
  const [products, setProducts] = useState(db.getProducts());
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    const all = db.getProducts();
    if (filter === 'All') setProducts(all);
    else setProducts(all.filter(p => p.category === filter));
  }, [filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <Seo 
        title="Shop Collection" 
        description="Browse our complete collection of Korean haircare products available in Nepal."
      />
      
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="font-serif text-4xl font-bold text-stone-900 mb-2">The Collection</h1>
          <p className="text-stone-500">Formulated in Seoul. Delivered to Nepal.</p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === cat ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p>No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {products.map(product => (
            <div 
              key={product.id} 
              className="group cursor-pointer"
              onClick={() => navigate(`/products/${product.slug}`)}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-200 mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-4 bottom-4 translate-y-0 lg:translate-y-full lg:group-hover:translate-y-0 transition-transform duration-300 z-10">
                  <Button 
                    fullWidth 
                    onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                    className="shadow-xl"
                    disabled={product.stock <= 0}
                  >
                    {product.stock > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
                  </Button>
                </div>
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center pointer-events-none">
                    <span className="bg-stone-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full">Sold Out</span>
                  </div>
                )}
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-serif text-lg text-stone-900 group-hover:text-amber-700 transition-colors">
                  {product.name}
                </h3>
                <PriceDisplay product={product} className="justify-center" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ReviewsSection = ({ productId }: { productId: string }) => {
  const [reviews, setReviews] = useState<Review[]>(db.getReviews(productId));
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setReviews(db.getReviews(productId));
  }, [productId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      const newReview = db.addReview({
        productId,
        userName: name,
        rating,
        comment,
      });
      setReviews(prev => [newReview, ...prev]);
      setName('');
      setComment('');
      setRating(5);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="mt-16 border-t border-stone-200 pt-16">
       <h2 className="font-serif text-3xl font-bold mb-10 text-center">Customer Reviews</h2>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Review Form */}
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 h-fit">
             <h3 className="font-bold text-lg mb-4">Write a Review</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                   <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Rating</label>
                   <div className="flex gap-2">
                     {[1, 2, 3, 4, 5].map(star => (
                       <button 
                         key={star}
                         type="button"
                         onClick={() => setRating(star)}
                         className={`transition-transform hover:scale-110 ${rating >= star ? 'text-amber-400' : 'text-stone-300'}`}
                       >
                         <Star className="w-6 h-6 fill-current" />
                       </button>
                     ))}
                   </div>
                </div>
                <Input label="Your Name" value={name} onChange={e => setName(e.target.value)} required />
                <div className="flex flex-col gap-1.5">
                   <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Review</label>
                   <textarea 
                     className="p-3 bg-white border border-stone-200 rounded-xl focus:border-amber-500 outline-none font-sans"
                     rows={3}
                     value={comment}
                     onChange={e => setComment(e.target.value)}
                     required
                   />
                </div>
                <Button type="submit" fullWidth disabled={isSubmitting}>
                   {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
                </Button>
             </form>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
             {reviews.length === 0 ? (
               <p className="text-stone-500 text-center py-10 italic">No reviews yet. Be the first to review!</p>
             ) : (
               reviews.map(review => (
                 <div key={review.id} className="border-b border-stone-100 pb-6 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                          <div className="font-bold text-stone-900 flex items-center gap-2">
                            {review.userName}
                            {review.isVerified && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Verified</span>}
                          </div>
                          <div className="flex text-amber-400 text-xs mt-1">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-stone-200 fill-stone-200'}`} />
                             ))}
                          </div>
                       </div>
                       <span className="text-xs text-stone-400">{review.date}</span>
                    </div>
                    <p className="text-stone-600 text-sm leading-relaxed">{review.comment}</p>
                 </div>
               ))
             )}
          </div>
       </div>
    </div>
  );
};

const ProductPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const product = db.getProductBySlug(slug || '');
  const { addToCart } = useCart();
  const { isInsideValley } = useLocationContext();
  const [qty, setQty] = useState(1);

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <h2 className="text-2xl font-serif">Product not found</h2>
      <Link to="/shop"><Button>Return to Shop</Button></Link>
    </div>
  );

  const handleBuyNow = () => {
    addToCart(product, qty);
    navigate('/checkout');
  };

  return (
    <div className="pt-8 pb-24 px-4 max-w-7xl mx-auto">
      <Seo 
        title={product.name} 
        description={product.description}
        image={product.images[0]}
        type="product"
        price={isInsideValley ? product.priceInside : product.priceOutside}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        <div className="space-y-4">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-stone-100 shadow-inner">
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-amber-600 font-bold tracking-widest text-xs uppercase mb-4">{product.category}</span>
          <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-6 leading-tight">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-8">
            <PriceDisplay product={product} className="text-2xl" />
            <div className="h-6 w-px bg-stone-300" />
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-stone-800">5.0</span>
            </div>
          </div>

          <p className="text-stone-600 leading-relaxed mb-8 text-lg font-light">
            {product.description}
          </p>

          <div className="space-y-4 mb-10">
            {product.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-stone-700">{feat}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1">
                <button 
                  className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-amber-700" 
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-lg">{qty}</span>
                <button 
                  className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-amber-700" 
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button 
                className="flex-1 py-4 text-lg" 
                onClick={() => addToCart(product, qty)}
                disabled={product.stock <= 0}
              >
                {product.stock > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
              </Button>
            </div>
            {product.stock > 0 && (
              <Button variant="secondary" fullWidth onClick={handleBuyNow}>
                BUY IT NOW
              </Button>
            )}
            
            <ShareButtons product={product} />
          </div>
          
          <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3 border border-amber-100">
             <Truck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
             <div className="text-sm text-stone-700">
               <span className="font-bold block text-stone-900 mb-1">Cash on Delivery Available</span>
               Free shipping on orders over NPR 5,000 inside Kathmandu Valley.
             </div>
          </div>
        </div>
      </div>

      <ReviewsSection productId={product.id} />
    </div>
  );
};

const Checkout = () => {
  const { items, cartTotal, clearCart } = useCart();
  const { isInsideValley, setInsideValley } = useLocationContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    province: '',
    district: '',
    address: '',
    landmark: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // If cart is empty, user can still be here if they just cleared it or navigated directly.
    // We let the UI render "Empty Cart" message below.
  }, [items]);

  if (items.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <Seo title="Secure Checkout" />
      <ShoppingBag className="w-16 h-16 text-stone-300 mb-4" />
      <h2 className="font-serif text-2xl font-bold mb-4">Your cart is empty</h2>
      <Button onClick={() => navigate('/shop')}>Start Shopping</Button>
    </div>
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerName) newErrors.customerName = "Name is required";
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) newErrors.phone = "Valid 10-digit phone required";
    if (!formData.province) newErrors.province = "Province is required";
    if (!formData.district) newErrors.district = "District is required";
    if (!formData.address) newErrors.address = "Address is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      const order = db.createOrder({
        ...formData,
        isInsideValley,
        items: items.map(i => ({
          productId: i.id,
          name: i.name,
          quantity: i.quantity,
          price: isInsideValley ? i.priceInside : i.priceOutside
        })),
        total: cartTotal
      });
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Seo title="Checkout" description="Complete your purchase safely using Cash on Delivery." />
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12">Secure Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-100">
            <h2 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm">1</div>
              Shipping Details
            </h2>
            
            <div className="mb-6 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isInsideValley ? 'bg-amber-600' : 'bg-stone-300'}`} onClick={() => setInsideValley(!isInsideValley)}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isInsideValley ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <span className="font-bold text-stone-800">
                  I am inside Kathmandu Valley
                </span>
              </label>
            </div>

            <div className="space-y-4">
               <Input 
                 label="Full Name" 
                 value={formData.customerName} 
                 onChange={e => setFormData({...formData, customerName: e.target.value})}
                 error={errors.customerName}
               />
               <Input 
                 label="Phone (10 digits)" 
                 value={formData.phone} 
                 onChange={e => setFormData({...formData, phone: e.target.value})}
                 error={errors.phone}
                 maxLength={10}
               />
               <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Province</label>
                    <select 
                      className="p-3 bg-white border border-stone-200 rounded-xl focus:border-amber-500 outline-none font-sans"
                      value={formData.province}
                      onChange={e => setFormData({...formData, province: e.target.value})}
                    >
                      <option value="">Select</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.province && <span className="text-xs text-red-500">{errors.province}</span>}
                 </div>
                 <Input 
                   label="District" 
                   value={formData.district} 
                   onChange={e => setFormData({...formData, district: e.target.value})}
                   error={errors.district}
                 />
               </div>
               <Input 
                 label="Street Address / Area" 
                 value={formData.address} 
                 onChange={e => setFormData({...formData, address: e.target.value})}
                 error={errors.address}
               />
               <Input 
                 label="Landmark (Optional)" 
                 value={formData.landmark} 
                 onChange={e => setFormData({...formData, landmark: e.target.value})}
               />
               <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs uppercase tracking-widest text-stone-500 font-bold">Order Notes</label>
                <textarea 
                  className="p-3 bg-white border border-stone-200 rounded-xl focus:border-amber-500 outline-none font-sans"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
           <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-stone-100 sticky top-24">
              <h2 className="font-serif text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                      <img src={item.images[0]} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-stone-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-amber-700">
                        NPR {((isInsideValley ? item.priceInside : item.priceOutside) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-100 pt-4 space-y-3">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>NPR {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Delivery</span>
                  <span>Calculated</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-stone-900 pt-4 border-t border-stone-100">
                  <span>Total</span>
                  <span className="text-amber-700">NPR {cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <Button 
                fullWidth 
                className="mt-8"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'PROCESSING...' : 'CONFIRM ORDER (COD)'}
              </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Admin ---

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@luxemoon.com' && password === 'admin') {
      onLogin();
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900 px-4">
      <Seo title="Admin Login" />
      <div className="bg-white p-8 rounded-2xl w-full max-w-md">
        <h1 className="font-serif text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <p className="text-center text-xs text-stone-400 mb-6">Demo: admin@luxemoon.com / admin</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Button fullWidth type="submit">LOGIN</Button>
        </form>
      </div>
    </div>
  );
};

const ProductForm = ({ product, onClose, onSave }: { product?: Product, onClose: () => void, onSave: () => void }) => {
  const [form, setForm] = useState<Partial<Product>>(product || {
    name: '',
    slug: '',
    category: CATEGORIES[0],
    priceInside: 0,
    priceOutside: 0,
    stock: 0,
    description: '',
    features: [],
    images: ['https://placehold.co/600x600?text=Product+Image']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct = {
      ...form,
      id: product?.id || Date.now().toString(),
      slug: form.slug || form.name?.toLowerCase().replace(/\s+/g, '-') || 'temp-slug',
    } as Product;
    
    db.saveProduct(newProduct);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{product ? 'Edit Product' : 'New Product'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <Input label="Slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Price Inside" type="number" value={form.priceInside} onChange={e => setForm({...form, priceInside: parseInt(e.target.value)})} required />
            <Input label="Price Outside" type="number" value={form.priceOutside} onChange={e => setForm({...form, priceOutside: parseInt(e.target.value)})} required />
            <Input label="Stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value)})} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase font-bold text-stone-500">Category</label>
            <select 
               className="p-3 border rounded-xl"
               value={form.category}
               onChange={e => setForm({...form, category: e.target.value})}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase font-bold text-stone-500">Description</label>
            <textarea 
               className="p-3 border rounded-xl"
               value={form.description}
               onChange={e => setForm({...form, description: e.target.value})}
               rows={4}
            />
          </div>
          <Input label="Image URL" value={form.images?.[0]} onChange={e => setForm({...form, images: [e.target.value]})} />
          
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Product</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAuth, setIsAuth] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>(undefined);
  const [showProductModal, setShowProductModal] = useState(false);
  const { config, refreshConfig } = useConfig();
  const [configForm, setConfigForm] = useState(config);

  const loadData = () => {
    setOrders(db.getOrders());
    setProducts(db.getProducts());
  };

  useEffect(() => {
    if(isAuth) loadData();
  }, [isAuth, activeTab]);

  const handleConfigSave = () => {
    db.updateConfig(configForm);
    refreshConfig();
    alert('Configuration Saved');
  };

  if (!isAuth) return <AdminLogin onLogin={() => setIsAuth(true)} />;

  return (
    <div className="min-h-screen bg-stone-100 flex">
      <Seo title="Admin Dashboard" />
      <aside className="w-64 bg-stone-900 text-stone-400 p-6 flex flex-col hidden md:flex">
        <div className="font-serif text-white text-xl font-bold mb-10">LUXE MOON</div>
        <nav className="space-y-2 flex-1">
          {['orders', 'products', 'config'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 capitalize ${activeTab === tab ? 'bg-amber-600 text-white' : 'hover:bg-stone-800'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <button onClick={() => setIsAuth(false)} className="flex items-center gap-2 text-red-400 hover:text-red-300">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-bold text-stone-900 capitalize">{activeTab}</h1>
           <button className="md:hidden text-stone-500" onClick={() => setIsAuth(false)}><LogOut /></button>
        </div>
        
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-50 border-b">
                  <tr>
                    <th className="p-4 font-bold">ID</th>
                    <th className="p-4 font-bold">Customer</th>
                    <th className="p-4 font-bold">Items</th>
                    <th className="p-4 font-bold">Total</th>
                    <th className="p-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-stone-50">
                      <td className="p-4 font-mono text-stone-500">{order.id}</td>
                      <td className="p-4">
                        <div className="font-bold">{order.customerName}</div>
                        <div className="text-xs text-stone-500">{order.phone}</div>
                        <div className="text-xs text-amber-600">{order.isInsideValley ? 'Inside Valley' : 'Outside Valley'}</div>
                      </td>
                      <td className="p-4">
                        {order.items.map(i => <div key={i.productId} className="text-xs">{i.quantity}x {i.name}</div>)}
                      </td>
                      <td className="p-4 font-bold">NPR {order.total.toLocaleString()}</td>
                      <td className="p-4">
                        <select 
                          className="bg-stone-100 border-none rounded text-xs p-1"
                          value={order.status}
                          onChange={(e) => {
                            db.updateOrderStatus(order.id, e.target.value as OrderStatus);
                            loadData();
                          }}
                        >
                          {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditProduct(undefined); setShowProductModal(true); }}>+ Add Product</Button>
            </div>
            <div className="grid gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <img src={p.images[0]} className="w-16 h-16 rounded object-cover" />
                      <div>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-sm text-stone-500">Stock: {p.stock} | {p.category}</div>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => { setEditProduct(p); setShowProductModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if(confirm('Delete?')) { db.deleteProduct(p.id); loadData(); } }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
              ))}
            </div>
            {showProductModal && (
              <ProductForm 
                product={editProduct} 
                onClose={() => setShowProductModal(false)} 
                onSave={() => { setShowProductModal(false); loadData(); }} 
              />
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="bg-white p-8 rounded-xl shadow-sm max-w-2xl">
            <h2 className="text-xl font-bold mb-6">Site Configuration</h2>
            <div className="space-y-4">
              <Input label="Banner Text" value={configForm.bannerText} onChange={e => setConfigForm({...configForm, bannerText: e.target.value})} />
              <Input label="Contact Phone" value={configForm.contactPhone} onChange={e => setConfigForm({...configForm, contactPhone: e.target.value})} />
              <Input label="Contact Email" value={configForm.contactEmail} onChange={e => setConfigForm({...configForm, contactEmail: e.target.value})} />
              <Input label="Office Address" value={configForm.officeAddress} onChange={e => setConfigForm({...configForm, officeAddress: e.target.value})} />
              <Button onClick={handleConfigSave}>Save Changes</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- App Root ---

const AppContent = () => {
  useScrollToTop();
  
  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={
        <div className="min-h-screen flex flex-col font-sans">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Hero />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/products/:slug" element={<ProductPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation/:id" element={
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center animate-fade-in-up">
                  <Seo title="Order Confirmed" />
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                    <Check className="w-12 h-12" />
                  </div>
                  <h1 className="font-serif text-4xl font-bold text-stone-900 mb-4">Order Placed!</h1>
                  <p className="text-stone-600 mb-8 max-w-md">
                    Thank you for choosing Luxe Moon. We will contact you shortly to confirm your order and delivery details.
                  </p>
                  <Link to="/"><Button variant="outline">Back to Home</Button></Link>
                </div>
              } />
              <Route path="/about" element={
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                  <Seo title="About Us" description="Luxe Moon - Bringing Korean haircare innovation to Nepal." />
                  <h1 className="font-serif text-5xl font-bold mb-8">Our Story</h1>
                  <p className="text-xl text-stone-600 leading-relaxed">
                    Luxe Moon was born from a desire to bring the sophisticated technology of Korean haircare to the unique climate and needs of Nepal. 
                    Our formulas are crafted in Seoul using premium botanicals like Argan Oil, Biotin, and Silk Proteins.
                  </p>
                </div>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      } />
    </Routes>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </BrowserRouter>
  );
}