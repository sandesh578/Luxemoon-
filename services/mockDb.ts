import { Product, Review, Order, OrderStatus, SiteConfig } from '../types';

// --- Constants & Initial Data ---

const IMAGES = {
  shampoo: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=800&auto=format&fit=crop',
  mask: 'https://images.unsplash.com/photo-1556228720-1987594a8163?q=80&w=800&auto=format&fit=crop',
  serum: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
  kit: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=800&auto=format&fit=crop',
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    slug: 'nano-botox-shampoo',
    name: 'Nano Botox Biotin + Keratin Shampoo',
    description: 'A revolutionary Korean formula designed to restore damaged hair. Enriched with Biotin and Keratin, this pH-balanced shampoo strengthens roots and adds a glass-like shine.',
    priceInside: 1800,
    priceOutside: 1950,
    originalPrice: 2200,
    category: 'Shampoo',
    images: [IMAGES.shampoo],
    features: ['Sulfate Free', 'Paraben Free', 'pH Balanced 5.5'],
    stock: 50,
    isFeatured: true
  },
  {
    id: 'p2',
    slug: 'shining-silk-hair-mask',
    name: 'Shining Silk Hair Mask 4-in-1',
    description: 'Deep conditioning treatment that works in minutes. The 4-in-1 formula hydrates, repairs, smoothes, and protects against environmental damage.',
    priceInside: 2500,
    priceOutside: 2650,
    category: 'Treatment',
    images: [IMAGES.mask],
    features: ['Deep Hydration', 'Anti-Frizz', 'Korean Silk Protein'],
    stock: 30,
    isFeatured: true
  },
  {
    id: 'p3',
    slug: 'soft-silky-serum',
    name: 'Soft and Silky Hair Serum',
    description: 'Lightweight, non-greasy serum that seals split ends and provides thermal protection. Perfect for daily styling in Nepal\'s humid climate.',
    priceInside: 1500,
    priceOutside: 1600,
    originalPrice: 1800,
    category: 'Serum',
    images: [IMAGES.serum],
    features: ['Heat Protection', 'Instant Shine', 'Non-Sticky'],
    stock: 100,
    isFeatured: false
  },
  {
    id: 'p4',
    slug: 'complete-nanoplastia-kit',
    name: 'Complete Nanoplastia Kit',
    description: 'The ultimate salon-level experience at home. Includes Shampoo, Mask, and Serum for a complete hair transformation. Best value.',
    priceInside: 5200,
    priceOutside: 5500,
    originalPrice: 5800,
    category: 'Kits',
    images: [IMAGES.kit],
    features: ['Complete Care', 'Value Pack', 'Premium Gift Box'],
    stock: 15,
    isFeatured: true
  }
];

const INITIAL_CONFIG: SiteConfig = {
  bannerText: "✨ Rooted in Korea. Created for the World. | Cash on Delivery Available ✨",
  deliveryChargeInside: 0,
  deliveryChargeOutside: 100,
  contactPhone: "+977 9800000000",
  contactEmail: "hello@luxemoon.com.np",
  officeAddress: "Durbarmarg, Kathmandu, Nepal"
};

const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    productId: 'p1',
    userName: 'Sita S.',
    rating: 5,
    comment: 'My hair feels so soft after just one wash!',
    date: '2023-11-01',
    isVerified: true
  },
  {
    id: 'r2',
    productId: 'p2',
    userName: 'Priya K.',
    rating: 5,
    comment: 'Best mask for frizzy hair. Smells amazing too.',
    date: '2023-11-05',
    isVerified: true
  }
];

// --- Storage Logic ---

const getStorage = (key: string, initial: any) => {
  if (typeof window === 'undefined') return initial;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initial;
  } catch (e) {
    console.error("Storage Error", e);
    return initial;
  }
};

const setStorage = (key: string, data: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// --- Config API ---

export const getConfig = (): SiteConfig => getStorage('lm_config', INITIAL_CONFIG);

export const updateConfig = (newConfig: SiteConfig) => {
  setStorage('lm_config', newConfig);
};

// --- Product API ---

export const getProducts = (): Product[] => getStorage('lm_products', INITIAL_PRODUCTS);

export const getProductBySlug = (slug: string): Product | undefined => {
  return getProducts().find(p => p.slug === slug);
};

export const saveProduct = (product: Product) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === product.id);
  if (index >= 0) {
    products[index] = product;
  } else {
    products.push(product);
  }
  setStorage('lm_products', products);
};

export const deleteProduct = (id: string) => {
  const products = getProducts().filter(p => p.id !== id);
  setStorage('lm_products', products);
};

// --- Order API ---

export const getOrders = (): Order[] => getStorage('lm_orders', []);

export const createOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
  const orders = getOrders();
  const products = getProducts();

  // Deduct stock
  orderData.items.forEach(item => {
    const productIndex = products.findIndex(p => p.id === item.productId);
    if (productIndex >= 0) {
      products[productIndex].stock = Math.max(0, products[productIndex].stock - item.quantity);
    }
  });
  setStorage('lm_products', products);

  const newOrder: Order = {
    ...orderData,
    id: `LM-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    status: OrderStatus.PENDING,
  };
  
  orders.unshift(newOrder);
  setStorage('lm_orders', orders);
  return newOrder;
};

export const updateOrderStatus = (id: string, status: OrderStatus) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index >= 0) {
    orders[index].status = status;
    setStorage('lm_orders', orders);
  }
};

// --- Review API ---

export const getReviews = (productId: string): Review[] => {
  const allReviews = getStorage('lm_reviews', MOCK_REVIEWS) as Review[];
  return allReviews.filter(r => r.productId === productId);
};

export const addReview = (reviewData: Omit<Review, 'id' | 'date' | 'isVerified'>) => {
  const allReviews = getStorage('lm_reviews', MOCK_REVIEWS) as Review[];
  const newReview: Review = {
    ...reviewData,
    id: `r-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    isVerified: false // User submitted reviews are unverified by default
  };
  allReviews.unshift(newReview);
  setStorage('lm_reviews', allReviews);
  return newReview;
};