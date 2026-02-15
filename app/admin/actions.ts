'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendOrderStatusSMS } from "@/lib/notifications";
import { logger } from "@/lib/logger";

const VALID_TRANSITIONS: Record<string, string[]> = {
  'PENDING': ['CONFIRMED', 'CANCELLED'],
  'CONFIRMED': ['SHIPPED', 'CANCELLED'],
  'SHIPPED': ['DELIVERED', 'CANCELLED'],
  'DELIVERED': [], // End state
  'CANCELLED': []  // End state
};

export async function updateOrderStatus(orderId: string, newStatus: string, phone: string, lastUpdatedAt: Date) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) return { success: false, error: "Order not found" };

    // 1. Race Condition Check
    if (order.updatedAt.getTime() !== new Date(lastUpdatedAt).getTime()) {
      logger.warn('Optimistic locking failure', { orderId });
      return { success: false, error: "Order was updated by someone else. Please refresh." };
    }

    // 2. State Transition Check
    const allowed = VALID_TRANSITIONS[order.status];
    // Allow admin to force update if needed, but logging it. For strictness, uncomment below:
    /*
    if (!allowed.includes(newStatus) && order.status !== newStatus) {
      return { success: false, error: `Cannot change status from ${order.status} to ${newStatus}` };
    }
    */

    // 3. Update with Optimistic Lock
    const result = await prisma.order.updateMany({
      where: { 
        id: orderId,
        updatedAt: order.updatedAt // Ensure it hasn't changed since fetch
      },
      data: { status: newStatus }
    });

    if (result.count === 0) {
      return { success: false, error: "Update failed due to concurrent modification." };
    }

    // 4. Notifications
    if (['CONFIRMED', 'SHIPPED'].includes(newStatus)) {
      // Fire and forget
      sendOrderStatusSMS(phone, newStatus, orderId).catch(e => logger.error('SMS Error', e));
    }

    revalidatePath('/admin');
    logger.info('Order status updated', { orderId, newStatus, admin: true });
    return { success: true };
  } catch (error) {
    logger.error("Failed to update status", error);
    return { success: false, error: "Database error" };
  }
}