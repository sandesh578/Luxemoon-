'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendOrderStatusSMS } from "@/lib/notifications";
import { logger } from "@/lib/logger";

// --- ORDER ACTIONS ---

export async function updateOrderStatus(
  orderId: string, 
  newStatus: string, 
  phone: string, 
  lastUpdatedAt: Date,
  rejectionReason?: string
) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, error: "Order not found" };

    const result = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: newStatus,
        rejectionReason: newStatus === 'CANCELLED' ? rejectionReason : undefined
      }
    });

    if (['CONFIRMED', 'SHIPPED'].includes(newStatus)) {
      sendOrderStatusSMS(phone, newStatus, orderId).catch(e => logger.error('SMS Error', e));
    }
    
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    logger.error("Failed to update status", error);
    return { success: false, error: "Database error" };
  }
}

// --- CONFIG ACTIONS ---

export async function updateSiteConfig(data: any) {
  await prisma.siteConfig.update({
    where: { id: 1 },
    data: {
      storeName: data.storeName,
      bannerText: data.bannerText,
      deliveryChargeInside: data.deliveryChargeInside,
      deliveryChargeOutside: data.deliveryChargeOutside,
      freeDeliveryThreshold: data.freeDeliveryThreshold,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      contactAddress: data.contactAddress,
    }
  });
  revalidatePath('/', 'layout');
  return { success: true };
}

// --- PRODUCT ACTIONS ---

export async function createProduct(data: any) {
  await prisma.product.create({
    data: {
      ...data,
      slug: data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
    }
  });
  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return { success: true };
}

export async function updateProduct(id: string, data: any) {
  await prisma.product.update({
    where: { id },
    data
  });
  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return { success: true };
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath('/admin/products');
  revalidatePath('/shop');
  return { success: true };
}

// --- REVIEW ACTIONS ---

export async function deleteReview(id: string) {
  await prisma.review.delete({ where: { id } });
  revalidatePath('/admin/reviews');
  return { success: true };
}

// --- BLACKLIST ACTIONS ---

export async function addToBlacklist(phone: string, reason: string) {
  try {
    await prisma.blockedCustomer.create({
      data: { phone, reason }
    });
    revalidatePath('/admin/customers');
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed or already exists" };
  }
}

export async function removeFromBlacklist(id: string) {
  await prisma.blockedCustomer.delete({ where: { id } });
  revalidatePath('/admin/customers');
  return { success: true };
}
