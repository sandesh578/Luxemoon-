import { prisma } from "./prisma";
import { cache } from "react";
import { SiteConfig } from "@prisma/client";

// In-memory TTL cache for SiteConfig
let cachedConfig: SiteConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 300_000; // 5 minutes

async function _getSiteConfig() {
  const now = Date.now();
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  let config = await prisma.siteConfig.findFirst();

  if (!config) {
    config = await prisma.siteConfig.create({
      data: {
        storeName: "Luxe Moon",
        bannerText: "Rooted in Korea. Created for the World.",
        deliveryChargeInside: 0,
        deliveryChargeOutside: 150,
        freeDeliveryThreshold: 5000,
        codFee: 0,
        expressDeliveryEnabled: false,
        estimatedDeliveryInside: "1-2 days",
        estimatedDeliveryOutside: "3-5 days",
        contactPhone: "+977 9800000000",
        contactEmail: "hello@luxemoon.com.np",
        contactAddress: "Durbarmarg, Kathmandu",
        emailNotificationsEnabled: false,
        smsNotificationsEnabled: false,
        globalDiscountPercent: 0,
      }
    });
  }

  cachedConfig = config;
  cacheTimestamp = now;
  return config;
}

/** React cache()-wrapped export — deduplicates within a single render pass */
export const getSiteConfig = cache(_getSiteConfig);

/** Invalidate the config cache (call after admin updates) */
export function invalidateSiteConfig() {
  cachedConfig = null;
  cacheTimestamp = 0;
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
