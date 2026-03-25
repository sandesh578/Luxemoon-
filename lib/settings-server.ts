import { prisma } from "./prisma";
import { unstable_cache, revalidateTag } from "next/cache";
import { SiteConfig } from "@prisma/client";

const DEFAULT_SITE_CONFIG: SiteConfig = {
  id: 1,
  storeName: "Luxe Moon",
  bannerText: "Rooted in Korea. Created for the World.",
  logoUrl: null,
  faviconUrl: null,
  languageToggleEnabled: false,
  showStockOnProduct: true,
  currencyCode: "USD",
  nprConversionRate: 133.5,
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
  contactEmail: "hello@luxemoonbeauty.com",
  contactAddress: "Durbarmarg, Kathmandu",
  whatsappNumber: null,
  facebookUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  metaTitle: "Luxe Moon | Premium Haircare & Cosmetics",
  metaDescription: "Experience the sophistication of Korean beauty with Luxe Moon's Nano Botox 4-in-1 system. Professional results for stronger, smoother, and shinier hair.",
  footerContent: "<p>3-step haircare system built for stronger roots, deep nourishment, and smooth frizz-controlled shine.</p>",
  privacyPolicy: "<h2>Privacy Policy</h2><p>We respect your privacy. Your data is never sold.</p>",
  termsConditions: "<h2>Terms & Conditions</h2><p>By using this site, you agree to our terms.</p>",
  aboutContent: "<h2>Our Story</h2><p>Luxe Moon is premium Korean haircare created for the world.</p>",
  deliveryPolicy: "<h2>Delivery Policy</h2><p>We deliver nationwide. 1-2 days inside valley, 3-5 days outside.</p>",
  refundPolicy: "<h2>Refund Policy</h2><p>7-day return policy for unused products.</p>",
  emailNotificationsEnabled: false,
  smsNotificationsEnabled: false,
};

const SITE_CONFIG_CREATE_DATA = {
  id: DEFAULT_SITE_CONFIG.id,
  storeName: DEFAULT_SITE_CONFIG.storeName,
  bannerText: DEFAULT_SITE_CONFIG.bannerText,
  logoUrl: DEFAULT_SITE_CONFIG.logoUrl,
  faviconUrl: DEFAULT_SITE_CONFIG.faviconUrl,
  languageToggleEnabled: DEFAULT_SITE_CONFIG.languageToggleEnabled,
  showStockOnProduct: DEFAULT_SITE_CONFIG.showStockOnProduct,
  currencyCode: DEFAULT_SITE_CONFIG.currencyCode,
  nprConversionRate: DEFAULT_SITE_CONFIG.nprConversionRate,
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
  try {
    return await prisma.siteConfig.upsert({
      where: { id: DEFAULT_SITE_CONFIG.id },
      update: {},
      create: SITE_CONFIG_CREATE_DATA,
    });
  } catch (error) {
    // If multiple requests try to upsert at once, one might fail with P2002.
    // In that case, we just try to find the record that was just created.
    const config = await prisma.siteConfig.findUnique({
      where: { id: DEFAULT_SITE_CONFIG.id },
    });
    if (config) return config;
    throw error;
  }
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
      noticeBarStill: false,
    };
  } catch {
    return {
      noticeBarText: null,
      noticeBarEnabled: false,
      noticeBarStill: false,
    };
  }
}

/** Cached notice bar fetch used by layout. */
export const getHomepageNotice = unstable_cache(
  async () => _getHomepageNotice(),
  ["homepage-notice"],
  { revalidate: 300, tags: ["homepage"] }
);

/** Invalidate config and homepage cache (call after admin updates). */
export function invalidateSiteConfig() {
  revalidateTag('config');
  revalidateTag('homepage');
}

export const invalidateConfigCache = invalidateSiteConfig;
