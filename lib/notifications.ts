import { Resend } from 'resend';
import { logger } from './logger';
import { prisma } from './prisma';
import { getSiteConfig } from './settings';

const getResendClient = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
};

// Status → human-readable labels
const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Order Confirmed',
  SHIPPED: 'Order Shipped',
  DELIVERED: 'Order Delivered',
  CANCELLED: 'Order Cancelled',
};

// Default templates (fallback if no DB template)
const DEFAULT_EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  CONFIRMED: {
    subject: 'Your Order #{{orderId}} is Confirmed!',
    body: '<h2>Order Confirmed!</h2><p>Hi {{customerName}}, your order #{{orderId}} has been confirmed.</p><p>We are preparing your items for shipment.</p>',
  },
  SHIPPED: {
    subject: 'Your Order #{{orderId}} has been Shipped!',
    body: '<h2>Order Shipped!</h2><p>Hi {{customerName}}, your order #{{orderId}} has been shipped.</p>{{trackingInfo}}<p>Estimated delivery: {{estimatedDelivery}}</p>',
  },
  DELIVERED: {
    subject: 'Your Order #{{orderId}} has been Delivered!',
    body: '<h2>Order Delivered!</h2><p>Hi {{customerName}}, your order #{{orderId}} has been delivered.</p><p>Thank you for shopping with Luxe Moon!</p>',
  },
  CANCELLED: {
    subject: 'Your Order #{{orderId}} has been Cancelled',
    body: '<h2>Order Cancelled</h2><p>Hi {{customerName}}, your order #{{orderId}} has been cancelled.</p><p>Reason: {{reason}}</p><p>If you have questions, please contact us.</p>',
  },
};

const DEFAULT_SMS_TEMPLATES: Record<string, string> = {
  CONFIRMED: 'Luxe Moon: Your order #{{orderId}} is confirmed! We are preparing your items.',
  SHIPPED: 'Luxe Moon: Your order #{{orderId}} has been shipped.{{trackingInfoSms}}',
  DELIVERED: 'Luxe Moon: Your order #{{orderId}} has been delivered. Thank you!',
  CANCELLED: 'Luxe Moon: Your order #{{orderId}} has been cancelled. Reason: {{reason}}',
};

function replacePlaceholders(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

interface NotificationContext {
  orderId: string;
  customerName: string;
  phone: string;
  status: string;
  trackingNumber?: string | null;
  courierName?: string | null;
  rejectionReason?: string | null;
  isInsideValley?: boolean;
  total?: number;
}

export async function sendOrderStatusNotification(ctx: NotificationContext): Promise<void> {
  const config = await getSiteConfig();

  const trackingInfo = ctx.trackingNumber
    ? `<p><strong>Tracking:</strong> ${ctx.courierName || 'Courier'} - ${ctx.trackingNumber}</p>`
    : '';
  const trackingInfoSms = ctx.trackingNumber
    ? ` Tracking: ${ctx.trackingNumber}`
    : '';

  const estimatedDelivery = ctx.isInsideValley
    ? config.estimatedDeliveryInside
    : config.estimatedDeliveryOutside;

  const vars: Record<string, string> = {
    orderId: ctx.orderId.slice(-8).toUpperCase(),
    customerName: ctx.customerName,
    trackingNumber: ctx.trackingNumber || '',
    trackingInfo,
    trackingInfoSms,
    estimatedDelivery,
    total: ctx.total ? `NPR ${ctx.total.toLocaleString()}` : '',
    reason: ctx.rejectionReason || 'No reason provided',
  };

  // Try DB template first
  let dbTemplate: { subject: string; bodyHtml: string; smsBody: string } | null = null;
  try {
    const found = await prisma.notificationTemplate.findUnique({
      where: { type: `ORDER_${ctx.status}` },
    });
    if (found) dbTemplate = found;
  } catch {
    // DB template not found, use defaults
  }

  // Send email
  if (config.emailNotificationsEnabled) {
    const subject = dbTemplate
      ? replacePlaceholders(dbTemplate.subject, vars)
      : replacePlaceholders(DEFAULT_EMAIL_TEMPLATES[ctx.status]?.subject || 'Order Update', vars);
    const body = dbTemplate
      ? replacePlaceholders(dbTemplate.bodyHtml, vars)
      : replacePlaceholders(DEFAULT_EMAIL_TEMPLATES[ctx.status]?.body || '<p>Your order status has been updated.</p>', vars);

    await sendEmail(ctx.orderId, subject, body, config.contactEmail);
  }

  // Send SMS
  if (config.smsNotificationsEnabled) {
    const smsBody = dbTemplate
      ? replacePlaceholders(dbTemplate.smsBody, vars)
      : replacePlaceholders(DEFAULT_SMS_TEMPLATES[ctx.status] || 'Luxe Moon: Your order status has been updated.', vars);

    await sendSMS(ctx.phone, smsBody, ctx.orderId);
  }
}

export async function sendOrderNotificationEmail(order: { id: string; customerName: string; phone: string; total: number }): Promise<void> {
  const resend = getResendClient();

  if (!resend) {
    logger.info('Mocking Email Send (No API Key)', { orderId: order.id });
    return;
  }

  try {
    await resend.emails.send({
      from: 'Luxe Moon Orders <orders@luxemoon.com.np>',
      to: ['admin@luxemoon.com.np'],
      subject: `New Order #${order.id.slice(-8).toUpperCase()} from ${order.customerName}`,
      html: `
        <h1>New Order Received</h1>
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Total:</strong> NPR ${order.total.toLocaleString()}</p>
        <p><a href="https://luxemoon.com.np/admin">View in Dashboard</a></p>
      `
    });
    logger.info('Order notification email sent', { orderId: order.id });
  } catch (error) {
    logger.error('Email sending failed', error, { orderId: order.id });
  }
}

async function sendEmail(orderId: string, subject: string, html: string, fromEmail: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    logger.info(`Mocking status email: ${subject}`, { orderId });
    return;
  }

  try {
    await resend.emails.send({
      from: `Luxe Moon <${fromEmail}>`,
      to: ['admin@luxemoon.com.np'],
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">${html}<hr style="margin-top:20px;border:none;border-top:1px solid #eee;"/><p style="font-size:12px;color:#999;">Luxe Moon Nepal</p></div>`,
    });
    logger.info('Status email sent', { orderId, subject });
  } catch (error) {
    logger.error('Status email failed', error, { orderId });
  }
}

async function sendSMS(phone: string, message: string, orderId: string): Promise<void> {
  const token = process.env.SPARROW_SMS_TOKEN;
  if (!token) {
    logger.info(`Mocking SMS to ${phone}: ${message}`, { orderId });
    return;
  }

  try {
    const params = new URLSearchParams({
      token,
      from: 'LuxeMoon',
      to: phone,
      text: message,
    });

    await fetch(`https://api.sparrowsms.com/v2/sms/?${params.toString()}`, {
      method: 'POST',
    });
    logger.info('SMS sent', { orderId, phone });
  } catch (error) {
    logger.error('SMS failed', error, { orderId, phone });
  }
}
