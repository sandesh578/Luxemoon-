'use server';

import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";
import { sendOrderStatusNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import { verifyAdmin } from "@/lib/auth";
import { invalidateSiteConfig } from "@/lib/settings";

// --- ORDER ACTIONS ---

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  phone: string,
  lastUpdatedAt: Date,
  rejectionReason?: string,
  trackingNumber?: string,
  courierName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdmin();
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, error: "Order not found" };

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus as any,
        rejectionReason: newStatus === 'CANCELLED' ? rejectionReason : undefined,
        trackingNumber: trackingNumber || undefined,
        courierName: courierName || undefined,
      }
    });

    // Send notifications for meaningful status changes
    const notifyStatuses = ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (notifyStatuses.includes(newStatus)) {
      sendOrderStatusNotification({
        orderId,
        customerName: order.customerName,
        phone,
        status: newStatus,
        trackingNumber,
        courierName,
        rejectionReason,
        isInsideValley: order.isInsideValley,
        total: order.total,
      }).catch((e: unknown) => logger.error('Notification Error', e));
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    logger.error("Failed to update status", error);
    return { success: false, error: "Database error" };
  }
}

export async function togglePaymentReceived(
  orderId: string,
  received: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdmin();
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentReceived: received },
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    logger.error('Failed to toggle payment', error);
    return { success: false, error: 'Database error' };
  }
}

export async function updateAdminNotes(
  orderId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdmin();
    await prisma.order.update({
      where: { id: orderId },
      data: { adminNotes: notes || null },
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    logger.error('Failed to update admin notes', error);
    return { success: false, error: 'Database error' };
  }
}

// --- CONFIG ACTIONS ---

export async function updateSiteConfig(data: Record<string, unknown>): Promise<{ success: boolean }> {
  await verifyAdmin();

  const updateData: Record<string, unknown> = {};
  const stringFields = [
    'storeName', 'bannerText', 'logoUrl', 'faviconUrl', 'contactPhone', 'contactEmail',
    'contactAddress', 'whatsappNumber', 'facebookUrl', 'instagramUrl', 'tiktokUrl',
    'metaTitle', 'metaDescription', 'footerContent', 'privacyPolicy',
    'termsConditions', 'aboutContent', 'estimatedDeliveryInside', 'estimatedDeliveryOutside',
    'deliveryPolicy', 'refundPolicy',
  ];
  const intFields = [
    'deliveryChargeInside', 'deliveryChargeOutside', 'freeDeliveryThreshold',
    'codFee', 'globalDiscountPercent',
  ];
  const booleanFields = [
    'expressDeliveryEnabled', 'emailNotificationsEnabled', 'smsNotificationsEnabled',
    'allowStacking', 'festiveSaleEnabled'
  ];
  const dateFields = ['globalDiscountStart', 'globalDiscountEnd'];

  for (const field of stringFields) {
    if (field in data) updateData[field] = data[field] ?? null;
  }
  for (const field of intFields) {
    if (field in data) updateData[field] = typeof data[field] === 'number' ? data[field] : parseInt(String(data[field])) || 0;
  }
  for (const field of booleanFields) {
    if (field in data) updateData[field] = Boolean(data[field]);
  }
  for (const field of dateFields) {
    if (field in data) updateData[field] = data[field] ? new Date(String(data[field])) : null;
  }

  await prisma.siteConfig.update({
    where: { id: 1 },
    data: updateData,
  });

  invalidateSiteConfig();
  revalidatePath('/');
  revalidatePath('/checkout');
  revalidatePath('/', 'layout');
  return { success: true };
}

// --- CATEGORY ACTIONS ---

export async function createCategory(data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    const name = String(data.name || '');
    const slug = data.slug ? String(data.slug) : name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    await prisma.category.create({
      data: {
        name,
        slug,
        image: data.image ? String(data.image) : null,
        description: data.description ? String(data.description) : null,
      }
    });
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(id: string, data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    let deletedAtUpdate: Date | null | undefined = undefined;
    if (data.isArchived === true) {
      deletedAtUpdate = new Date();
    } else if (data.isArchived === false) {
      deletedAtUpdate = null;
    }

    await prisma.category.update({
      where: { id },
      data: {
        name: data.name !== undefined ? String(data.name) : undefined,
        slug: data.slug !== undefined ? String(data.slug) : undefined,
        image: data.image !== undefined ? (data.image ? String(data.image) : null) : undefined,
        description: data.description !== undefined ? (data.description ? String(data.description) : null) : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
        isArchived: data.isArchived !== undefined ? Boolean(data.isArchived) : undefined,
        deletedAt: deletedAtUpdate,
      }
    });
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return { success: false, error: "Category not found" };

    if (!category.isArchived) {
      return { success: false, error: "Category must be archived before deletion" };
    }

    // Check if products are using this category
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) return { success: false, error: "Cannot delete category linked to products." };

    await prisma.category.delete({ where: { id } });
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to delete category" };
  }
}

// --- PRODUCT ACTIONS ---

export async function createProduct(data: Record<string, unknown>): Promise<{ success: boolean }> {
  await verifyAdmin();
  const name = String(data.name || '');
  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  await prisma.product.create({
    data: {
      slug,
      name,
      description: String(data.description || ''),
      priceInside: Number(data.priceInside) || 0,
      priceOutside: Number(data.priceOutside) || 0,
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      categoryId: data.categoryId ? String(data.categoryId) : null,
      images: (data.images as string[]) || [],
      features: (data.features as string[]) || [],
      videoUrl: data.videoUrl ? String(data.videoUrl) : null,
      stock: Number(data.stock) || 0,
      sku: data.sku ? String(data.sku) : null,
      weight: data.weight ? String(data.weight) : null,
      dimensions: data.dimensions ? String(data.dimensions) : null,
      discountPercent: Number(data.discountPercent) || 0,
      discountFixed: data.discountFixed ? Number(data.discountFixed) : null,
      discountStart: data.discountStart ? new Date(String(data.discountStart)) : null,
      discountEnd: data.discountEnd ? new Date(String(data.discountEnd)) : null,
      isFeatured: Boolean(data.isFeatured),
      isNew: Boolean(data.isNew),
      seoTitle: data.seoTitle ? String(data.seoTitle) : null,
      seoDescription: data.seoDescription ? String(data.seoDescription) : null,
      tags: (data.tags as string[]) || [],
      isBundle: Boolean(data.isBundle),
      bundleItemIds: (data.bundleItemIds as string[]) || [],
      // Marketing
      marketingDescription: data.marketingDescription ? String(data.marketingDescription) : null,
      ingredients: data.ingredients ? String(data.ingredients) : null,
      howToUse: data.howToUse ? String(data.howToUse) : null,
      benefits: (data.benefits as string[]) || [],
      comparisonImages: (data.comparisonImages as string[]) || [],
      faqs: data.faqs || [],
    }
  });
  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return { success: true };
}

export async function updateProduct(id: string, data: Record<string, unknown>): Promise<{ success: boolean }> {
  await verifyAdmin();

  // Filter out id, createdAt, updatedAt, and relation fields
  const { id: _id, createdAt: _c, updatedAt: _u, reviews: _r, orderItems: _o, ...rest } = data;

  let deletedAtUpdate: Date | null | undefined = undefined;
  if (rest.isArchived === true) {
    deletedAtUpdate = new Date();
  } else if (rest.isArchived === false) {
    deletedAtUpdate = null;
  }

  await prisma.product.update({
    where: { id },
    data: {
      name: rest.name !== undefined ? String(rest.name) : undefined,
      description: rest.description !== undefined ? String(rest.description) : undefined,
      priceInside: rest.priceInside !== undefined ? Number(rest.priceInside) : undefined,
      priceOutside: rest.priceOutside !== undefined ? Number(rest.priceOutside) : undefined,
      originalPrice: rest.originalPrice !== undefined ? (rest.originalPrice ? Number(rest.originalPrice) : null) : undefined,
      categoryId: rest.categoryId !== undefined ? (rest.categoryId ? String(rest.categoryId) : null) : undefined,
      images: rest.images !== undefined ? (rest.images as string[]) : undefined,
      features: rest.features !== undefined ? (rest.features as string[]) : undefined,
      videoUrl: rest.videoUrl !== undefined ? (rest.videoUrl ? String(rest.videoUrl) : null) : undefined,
      stock: rest.stock !== undefined ? Number(rest.stock) : undefined,
      sku: rest.sku !== undefined ? (rest.sku ? String(rest.sku) : null) : undefined,
      weight: rest.weight !== undefined ? (rest.weight ? String(rest.weight) : null) : undefined,
      dimensions: rest.dimensions !== undefined ? (rest.dimensions ? String(rest.dimensions) : null) : undefined,
      discountPercent: rest.discountPercent !== undefined ? Number(rest.discountPercent) : undefined,
      discountFixed: rest.discountFixed !== undefined ? (rest.discountFixed ? Number(rest.discountFixed) : null) : undefined,
      discountStart: rest.discountStart !== undefined ? (rest.discountStart ? new Date(String(rest.discountStart)) : null) : undefined,
      discountEnd: rest.discountEnd !== undefined ? (rest.discountEnd ? new Date(String(rest.discountEnd)) : null) : undefined,
      isFeatured: rest.isFeatured !== undefined ? Boolean(rest.isFeatured) : undefined,
      isNew: rest.isNew !== undefined ? Boolean(rest.isNew) : undefined,
      seoTitle: rest.seoTitle !== undefined ? (rest.seoTitle ? String(rest.seoTitle) : null) : undefined,
      seoDescription: rest.seoDescription !== undefined ? (rest.seoDescription ? String(rest.seoDescription) : null) : undefined,
      tags: rest.tags !== undefined ? (rest.tags as string[]) : undefined,
      isBundle: rest.isBundle !== undefined ? Boolean(rest.isBundle) : undefined,
      bundleItemIds: rest.bundleItemIds !== undefined ? (rest.bundleItemIds as string[]) : undefined,
      // Marketing
      marketingDescription: rest.marketingDescription !== undefined ? (rest.marketingDescription ? String(rest.marketingDescription) : null) : undefined,
      ingredients: rest.ingredients !== undefined ? (rest.ingredients ? String(rest.ingredients) : null) : undefined,
      howToUse: rest.howToUse !== undefined ? (rest.howToUse ? String(rest.howToUse) : null) : undefined,
      benefits: rest.benefits !== undefined ? (rest.benefits as string[]) : undefined,
      comparisonImages: rest.comparisonImages !== undefined ? (rest.comparisonImages as string[]) : undefined,
      faqs: rest.faqs !== undefined ? (rest.faqs || undefined) : undefined,
      isActive: rest.isActive !== undefined ? Boolean(rest.isActive) : undefined,
      isArchived: rest.isArchived !== undefined ? Boolean(rest.isArchived) : undefined,
      isDraft: rest.isDraft !== undefined ? Boolean(rest.isDraft) : undefined,
      deletedAt: deletedAtUpdate,
    }
  });
  revalidatePath('/admin/products');
  revalidatePath('/shop');
  revalidatePath('/');
  return { success: true };
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } }
    });

    if (!product) return { success: false, error: "Product not found" };

    if (!product.isArchived) {
      return { success: false, error: "Product must be archived before deletion" };
    }

    if (product._count.orderItems > 0) {
      return { success: false, error: "Cannot delete product with order history." };
    }

    await prisma.product.delete({ where: { id } });

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    logger.error("Failed to delete product", error);
    return { success: false, error: "Failed to delete product" };
  }
}

// --- REVIEW ACTIONS ---

export async function approveReview(id: string): Promise<{ success: boolean }> {
  await verifyAdmin();
  await prisma.review.update({ where: { id }, data: { approved: true, isHidden: false } });
  revalidatePath('/admin/reviews');
  revalidatePath('/products/[slug]', 'page');
  return { success: true };
}

export async function rejectReview(id: string): Promise<{ success: boolean }> {
  await verifyAdmin();
  await prisma.review.update({ where: { id }, data: { approved: false, isHidden: true } });
  revalidatePath('/admin/reviews');
  revalidatePath('/products/[slug]', 'page');
  return { success: true };
}

export async function deleteReview(id: string): Promise<{ success: boolean }> {
  await verifyAdmin();
  await prisma.review.delete({ where: { id } });
  revalidatePath('/admin/reviews');
  revalidatePath('/products/[slug]', 'page');
  return { success: true };
}

export async function toggleVerifiedPurchase(id: string, verified: boolean): Promise<{ success: boolean }> {
  await verifyAdmin();
  await prisma.review.update({ where: { id }, data: { verifiedPurchase: verified } });
  revalidatePath('/admin/reviews');
  revalidatePath('/products/[slug]', 'page');
  return { success: true };
}

export async function toggleReviewVisibility(id: string, isHidden: boolean): Promise<{ success: boolean }> {
  await verifyAdmin();
  await prisma.review.update({ where: { id }, data: { isHidden } });
  revalidatePath('/admin/reviews');
  revalidatePath('/products/[slug]', 'page');
  return { success: true };
}

export async function toggleReviewFeatured(id: string, isFeatured: boolean): Promise<{ success: boolean }> {
  await verifyAdmin();
  await prisma.review.update({ where: { id }, data: { isFeatured } });
  revalidatePath('/admin/reviews');
  revalidatePath('/products/[slug]', 'page');
  return { success: true };
}

export async function editReview(id: string, comment: string, rating: number): Promise<{ success: boolean }> {
  await verifyAdmin();
  await prisma.review.update({ where: { id }, data: { comment, rating } });
  revalidatePath('/admin/reviews');
  revalidatePath('/products/[slug]', 'page');
  return { success: true };
}

// --- TRANSFORMATION ACTIONS ---

export async function createTransformation(data: any): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    await prisma.transformation.create({
      data: {
        beforeImage: data.beforeImage,
        afterImage: data.afterImage,
        caption: data.caption || null,
        durationUsed: data.durationUsed || null,
        productId: data.productId,
        isFeatured: Boolean(data.isFeatured),
      }
    });
    revalidatePath('/admin/transformations');
    revalidatePath('/products/[slug]', 'page');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to create transformation' };
  }
}

export async function updateTransformation(id: string, data: any): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    await prisma.transformation.update({
      where: { id },
      data: {
        beforeImage: data.beforeImage,
        afterImage: data.afterImage,
        caption: data.caption || null,
        durationUsed: data.durationUsed || null,
        productId: data.productId,
        isFeatured: Boolean(data.isFeatured),
      }
    });
    revalidatePath('/admin/transformations');
    revalidatePath('/products/[slug]', 'page');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update transformation' };
  }
}

export async function deleteTransformation(id: string): Promise<{ success: boolean }> {
  await verifyAdmin();
  try {
    await prisma.transformation.delete({ where: { id } });
    revalidatePath('/admin/transformations');
    revalidatePath('/products/[slug]', 'page');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// --- BLACKLIST ACTIONS ---

export async function addToBlacklist(phone: string, reason: string): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    await prisma.blockedCustomer.create({
      data: { phone, reason }
    });
    revalidatePath('/admin/customers');
    return { success: true };
  } catch {
    return { success: false, error: "Failed or already exists" };
  }
}

export async function removeFromBlacklist(id: string): Promise<{ success: boolean }> {
  await verifyAdmin();
  await prisma.blockedCustomer.delete({ where: { id } });
  revalidatePath('/admin/customers');
  return { success: true };
}

// --- MESSAGE ACTIONS ---

export async function toggleMessageResolved(
  id: string,
  isResolved: boolean
): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    await prisma.contactMessage.update({
      where: { id },
      data: { isResolved },
    });
    revalidatePath('/admin/messages');
    return { success: true };
  } catch (error) {
    logger.error("Failed to toggle message resolved state", error);
    return { success: false, error: "Failed to update message" };
  }
}

export async function deleteMessage(id: string): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    await prisma.contactMessage.delete({ where: { id } });
    revalidatePath('/admin/messages');
    return { success: true };
  } catch (error) {
    logger.error("Failed to delete message", error);
    return { success: false, error: "Failed to delete message" };
  }
}

export async function getHomepageContent() {
  await verifyAdmin();
  let content = await prisma.homepageContent.findUnique({ where: { id: 1 } });
  if (!content) {
    content = await prisma.homepageContent.create({
      data: { id: 1, heroSlides: [], banners: [], promotionalImages: [] }
    });
  }
  return content;
}

export async function updateHomepageContent(data: any): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    await prisma.homepageContent.update({
      where: { id: 1 },
      data: {
        heroSlides: data.heroSlides || [],
        banners: data.banners || [],
        promotionalImages: data.promotionalImages || [],
        noticeBarText: data.noticeBarText || null,
        noticeBarEnabled: Boolean(data.noticeBarEnabled),
      }
    });
    invalidateSiteConfig();
    revalidatePath('/');
    revalidatePath('/admin/homepage');
    return { success: true };
  } catch (error) {
    logger.error("Failed to update homepage content", error);
    return { success: false, error: "Database error" };
  }
}

export async function resendNotification(orderId: string, type: 'SMS' | 'EMAIL'): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    if (type === 'SMS') {
      await prisma.notificationLog.create({
        data: {
          orderId,
          type: 'SMS',
          status: 'SUCCESS',
          sentAt: new Date(),
        }
      });
    } else {
      await prisma.notificationLog.create({
        data: {
          orderId,
          type: 'EMAIL',
          status: 'SUCCESS',
          sentAt: new Date(),
        }
      });
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    logger.error("Failed to resend notification", error);
    return { success: false, error: "Database error" };
  }
}
// --- COUPON ACTIONS ---

export async function createCoupon(data: any): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    await prisma.coupon.create({ data });
    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: 'Coupon code already exists' };
    return { success: false, error: 'Failed to create coupon' };
  }
}

export async function updateCoupon(id: string, data: any): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    await prisma.coupon.update({ where: { id }, data });
    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: 'Coupon code already exists' };
    return { success: false, error: 'Failed to update coupon' };
  }
}

export async function toggleCouponActive(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    await prisma.coupon.update({ where: { id }, data: { isActive } });
    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed' };
  }
}

export async function softDeleteCoupon(id: string): Promise<{ success: boolean }> {
  await verifyAdmin();
  await prisma.coupon.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath('/admin/coupons');
  return { success: true };
}

export async function restoreCoupon(id: string): Promise<{ success: boolean }> {
  await verifyAdmin();
  await prisma.coupon.update({ where: { id }, data: { deletedAt: null } });
  revalidatePath('/admin/coupons');
  return { success: true };
}

export async function permanentDeleteCoupon(id: string): Promise<{ success: boolean }> {
  await verifyAdmin();
  await prisma.coupon.delete({ where: { id } });
  revalidatePath('/admin/coupons');
  return { success: true };
}

export async function duplicateCoupon(id: string): Promise<{ success: boolean; error?: string }> {
  await verifyAdmin();
  try {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Not found" };

    const { id: _id, code, createdAt, updatedAt, usageCount, ...rest } = existing;
    await prisma.coupon.create({
      data: {
        ...rest,
        code: `${code}_COPY_${Math.floor(Math.random() * 1000)}`,
        usageCount: 0
      }
    });
    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to duplicate" };
  }
}
