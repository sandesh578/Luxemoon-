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

    // 1. Race Condition Check
    if (order.updatedAt.getTime() !== new Date(lastUpdatedAt).getTime()) {
      logger.warn('Optimistic locking failure', { orderId });
      return { success: false, error: "Order was updated by someone else. Please refresh." };
    }

    // 2. State Transition Check
    if (newStatus === 'CANCELLED' && !rejectionReason && order.status !== 'CANCELLED') {
       // Optional: Enforce reason for cancellation
    }

    // 3. Update with Optimistic Lock
    const result = await prisma.order.updateMany({
      where: { 
        id: orderId,
        updatedAt: order.updatedAt 
      },
      data: { 
        status: newStatus,
        rejectionReason: newStatus === 'CANCELLED' ? rejectionReason : undefined
      }
    });

    if (result.count === 0) {
      return { success: false, error: "Update failed due to concurrent modification." };
    }

    // 4. Notifications
    if (['CONFIRMED', 'SHIPPED'].includes(newStatus)) {
      sendOrderStatusSMS(phone, newStatus, orderId).catch(e => logger.error('SMS Error', e));
    }
    
    // Send rejection SMS if needed
    if (newStatus === 'CANCELLED' && rejectionReason) {
       // Implement specific rejection SMS if required
       logger.info('Order rejected', { orderId, reason: rejectionReason });
    }

    revalidatePath('/admin');
    logger.info('Order status updated', { orderId, newStatus, admin: true });
    return { success: true };
  } catch (error) {
    logger.error("Failed to update status", error);
    return { success: false, error: "Database error" };
  }
}