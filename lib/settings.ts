import { prisma } from "./prisma";
import { cache } from "react";
import { SiteConfig } from "@prisma/client";

// In-memory TTL cache for SiteConfig and homepage notice content.
let cachedConfig: SiteConfig | null = null;
let cacheTimestamp = 0;
let cachedHomepageNotice: { noticeBarText: string | null; noticeBarEnabled: boolean } | null = null;
let homepageCacheTimestamp = 0;
const CACHE_TTL = 300_000; // 5 minutes
const DEFAULT_SITE_CONFIG: SiteConfig = {
  id: 1,
  storeName: "Luxe Moon",
  bannerText: "Rooted in Korea. Created for the World.",
  logoUrl: null,
  faviconUrl: null,
  deliveryChargeInside: 0,
  deliveryChargeOutside: 150,
  freeDeliveryThreshold: 5000,
  codFee: 0,
  expressDeliveryEnabled: false,
  estimatedDeliveryInside: "1-2 days",
  estimatedDeliveryOutside: "3-5 days",
  globalDiscountPercent: 0,
  globalDiscountStart: null,
  globalDiscountEnd: null,
  allowStacking: false,
  festiveSaleEnabled: false,
  contactPhone: "+977 9800000000",
  contactEmail: "hello@luxemoon.com.np",
  contactAddress: "Durbarmarg, Kathmandu",
  whatsappNumber: null,
  facebookUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  metaTitle: null,
  metaDescription: null,
  footerContent: null,
  privacyPolicy: null,
  termsConditions: null,
  aboutContent: null,
  deliveryPolicy: null,
  refundPolicy: null,
  emailNotificationsEnabled: false,
  smsNotificationsEnabled: false,
};

async function _getSiteConfig() {
  const now = Date.now();
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  let config: SiteConfig | null = null;

  try {
    config = await prisma.siteConfig.findFirst();

    if (!config) {
      config = await prisma.siteConfig.create({
        data: {
          storeName: DEFAULT_SITE_CONFIG.storeName,
          bannerText: DEFAULT_SITE_CONFIG.bannerText,
          deliveryChargeInside: DEFAULT_SITE_CONFIG.deliveryChargeInside,
          deliveryChargeOutside: DEFAULT_SITE_CONFIG.deliveryChargeOutside,
          freeDeliveryThreshold: DEFAULT_SITE_CONFIG.freeDeliveryThreshold,
          codFee: DEFAULT_SITE_CONFIG.codFee,
          expressDeliveryEnabled: DEFAULT_SITE_CONFIG.expressDeliveryEnabled,
          estimatedDeliveryInside: DEFAULT_SITE_CONFIG.estimatedDeliveryInside,
          estimatedDeliveryOutside: DEFAULT_SITE_CONFIG.estimatedDeliveryOutside,
          contactPhone: DEFAULT_SITE_CONFIG.contactPhone,
          contactEmail: DEFAULT_SITE_CONFIG.contactEmail,
          contactAddress: DEFAULT_SITE_CONFIG.contactAddress,
          emailNotificationsEnabled: DEFAULT_SITE_CONFIG.emailNotificationsEnabled,
          smsNotificationsEnabled: DEFAULT_SITE_CONFIG.smsNotificationsEnabled,
          globalDiscountPercent: DEFAULT_SITE_CONFIG.globalDiscountPercent,
        },
      });
    }
  } catch {
    // During build or temporary DB outages, keep rendering with safe defaults.
    config = DEFAULT_SITE_CONFIG;
  }

  cachedConfig = config;
  cacheTimestamp = now;
  return config;
}

/** React cache()-wrapped export that deduplicates within a single render pass. */
export const getSiteConfig = cache(_getSiteConfig);

async function _getHomepageNotice() {
  const now = Date.now();
  if (cachedHomepageNotice && now - homepageCacheTimestamp < CACHE_TTL) {
    return cachedHomepageNotice;
  }

  try {
    const homepage = await prisma.homepageContent.findUnique({
      where: { id: 1 },
      select: { noticeBarText: true, noticeBarEnabled: true },
    });

    cachedHomepageNotice = {
      noticeBarText: homepage?.noticeBarText ?? null,
      noticeBarEnabled: homepage?.noticeBarEnabled ?? false,
    };
  } catch {
    cachedHomepageNotice = {
      noticeBarText: null,
      noticeBarEnabled: false,
    };
  }
  homepageCacheTimestamp = now;
  return cachedHomepageNotice;
}

/** Cached notice bar fetch used by layout. */
export const getHomepageNotice = cache(_getHomepageNotice);

/** Invalidate config and homepage cache (call after admin updates). */
export function invalidateSiteConfig() {
  cachedConfig = null;
  cacheTimestamp = 0;
  cachedHomepageNotice = null;
  homepageCacheTimestamp = 0;
}

// Backward compatible alias
export const invalidateConfigCache = invalidateSiteConfig;

/**
 * Check if a product discount is currently active based on date range.
 */
export function isDiscountActive(
  discountStart: Date | null,
  discountEnd: Date | null
): boolean {
  const now = new Date();
  if (discountStart && now < discountStart) return false;
  if (discountEnd && now > discountEnd) return false;
  return true;
}

/**
 * Calculate the effective price after product-level and global discounts.
 */
export function calculateDiscountedPrice(
  basePrice: number,
  product: {
    discountPercent: number;
    discountFixed: number | null;
    discountStart: Date | null;
    discountEnd: Date | null;
  },
  globalConfig: {
    globalDiscountPercent: number;
    globalDiscountStart: Date | null;
    globalDiscountEnd: Date | null;
    allowStacking: boolean;
  }
): number {
  let price = basePrice;
  let hasProductDiscount = false;

  // 1. Product-level discount
  if (isDiscountActive(product.discountStart, product.discountEnd)) {
    if (product.discountFixed && product.discountFixed > 0) {
      price = Math.max(0, price - product.discountFixed);
      hasProductDiscount = true;
    } else if (product.discountPercent > 0) {
      price = Math.round(price * (1 - product.discountPercent / 100));
      hasProductDiscount = true;
    }
  }

  // 2. Global discount
  if (!globalConfig.allowStacking && hasProductDiscount) {
    return Math.max(0, price);
  }

  if (
    globalConfig.globalDiscountPercent > 0 &&
    isDiscountActive(globalConfig.globalDiscountStart, globalConfig.globalDiscountEnd)
  ) {
    price = Math.round(price * (1 - globalConfig.globalDiscountPercent / 100));
  }

  return Math.max(0, price);
}
