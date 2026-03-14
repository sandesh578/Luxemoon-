import { prisma } from "./prisma";
import { unstable_cache } from "next/cache";
import { SiteConfig } from "@prisma/client";

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

const SITE_CONFIG_CREATE_DATA = {
  id: DEFAULT_SITE_CONFIG.id,
  storeName: DEFAULT_SITE_CONFIG.storeName,
  bannerText: DEFAULT_SITE_CONFIG.bannerText,
  logoUrl: DEFAULT_SITE_CONFIG.logoUrl,
  faviconUrl: DEFAULT_SITE_CONFIG.faviconUrl,
  deliveryChargeInside: DEFAULT_SITE_CONFIG.deliveryChargeInside,
  deliveryChargeOutside: DEFAULT_SITE_CONFIG.deliveryChargeOutside,
  freeDeliveryThreshold: DEFAULT_SITE_CONFIG.freeDeliveryThreshold,
  codFee: DEFAULT_SITE_CONFIG.codFee,
  expressDeliveryEnabled: DEFAULT_SITE_CONFIG.expressDeliveryEnabled,
  estimatedDeliveryInside: DEFAULT_SITE_CONFIG.estimatedDeliveryInside,
  estimatedDeliveryOutside: DEFAULT_SITE_CONFIG.estimatedDeliveryOutside,
  globalDiscountPercent: DEFAULT_SITE_CONFIG.globalDiscountPercent,
  globalDiscountStart: DEFAULT_SITE_CONFIG.globalDiscountStart,
  globalDiscountEnd: DEFAULT_SITE_CONFIG.globalDiscountEnd,
  allowStacking: DEFAULT_SITE_CONFIG.allowStacking,
  festiveSaleEnabled: DEFAULT_SITE_CONFIG.festiveSaleEnabled,
  contactPhone: DEFAULT_SITE_CONFIG.contactPhone,
  contactEmail: DEFAULT_SITE_CONFIG.contactEmail,
  contactAddress: DEFAULT_SITE_CONFIG.contactAddress,
  whatsappNumber: DEFAULT_SITE_CONFIG.whatsappNumber,
  facebookUrl: DEFAULT_SITE_CONFIG.facebookUrl,
  instagramUrl: DEFAULT_SITE_CONFIG.instagramUrl,
  tiktokUrl: DEFAULT_SITE_CONFIG.tiktokUrl,
  metaTitle: DEFAULT_SITE_CONFIG.metaTitle,
  metaDescription: DEFAULT_SITE_CONFIG.metaDescription,
  footerContent: DEFAULT_SITE_CONFIG.footerContent,
  privacyPolicy: DEFAULT_SITE_CONFIG.privacyPolicy,
  termsConditions: DEFAULT_SITE_CONFIG.termsConditions,
  aboutContent: DEFAULT_SITE_CONFIG.aboutContent,
  deliveryPolicy: DEFAULT_SITE_CONFIG.deliveryPolicy,
  refundPolicy: DEFAULT_SITE_CONFIG.refundPolicy,
  emailNotificationsEnabled: DEFAULT_SITE_CONFIG.emailNotificationsEnabled,
  smsNotificationsEnabled: DEFAULT_SITE_CONFIG.smsNotificationsEnabled,
};

async function getOrCreateSiteConfig() {
  return prisma.siteConfig.upsert({
    where: { id: DEFAULT_SITE_CONFIG.id },
    update: {},
    create: SITE_CONFIG_CREATE_DATA,
  });
}

async function _getSiteConfig() {
  try {
    return await getOrCreateSiteConfig();
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export const getSiteConfig = unstable_cache(
  async () => _getSiteConfig(),
  ["site-config"],
  { revalidate: 300, tags: ["config"] }
);

export async function getSiteConfigForAdmin() {
  return getOrCreateSiteConfig();
}

async function _getHomepageNotice() {
  try {
    const homepage = await prisma.homepageContent.findUnique({
      where: { id: 1 },
      select: { noticeBarText: true, noticeBarEnabled: true },
    });

    return {
      noticeBarText: homepage?.noticeBarText ?? null,
      noticeBarEnabled: homepage?.noticeBarEnabled ?? false,
    };
  } catch {
    return {
      noticeBarText: null,
      noticeBarEnabled: false,
    };
  }
}

/** Cached notice bar fetch used by layout. */
export const getHomepageNotice = unstable_cache(
  async () => _getHomepageNotice(),
  ["homepage-notice"],
  { revalidate: 300, tags: ["homepage"] }
);

import { revalidateTag } from 'next/cache';

/** Invalidate config and homepage cache (call after admin updates). */
export function invalidateSiteConfig() {
  revalidateTag('config');
  revalidateTag('homepage');
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

  // 1. Product-level discount check (discount is already baked into basePrice in the DB)
  if (isDiscountActive(product.discountStart, product.discountEnd)) {
    if ((product.discountFixed && product.discountFixed > 0) || (product.discountPercent && product.discountPercent > 0)) {
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
