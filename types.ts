export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceInside: number;
  priceOutside: number;
  originalPrice?: number;
  category: string;
  images: string[];
  videoUrl?: string;
  features: string[];
  stock: number;
  isFeatured?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  imageUrl?: string;
  isVerified?: boolean;
}

export enum OrderStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  province: string;
  district: string;
  address: string;
  landmark?: string;
  isInsideValley: boolean;
  notes?: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface SiteConfig {
  bannerText: string;
  deliveryChargeInside: number;
  deliveryChargeOutside: number;
  contactPhone: string;
  contactEmail: string;
  officeAddress: string;
}

export const PROVINCES = [
  "Koshi Province",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpashchim Province"
];

export const CATEGORIES = [
  "Shampoo",
  "Treatment",
  "Serum",
  "Kits",
  "Accessories"
];