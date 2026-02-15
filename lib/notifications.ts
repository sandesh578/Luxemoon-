import { Resend } from 'resend';
import { logger } from './logger';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

export async function sendOrderNotificationEmail(order: any) {
  if (!process.env.RESEND_API_KEY) {
    logger.info('Mocking Email Send', { orderId: order.id });
    return;
  }

  try {
    await resend.emails.send({
      from: 'Luxe Moon Orders <orders@luxemoon.com.np>',
      to: ['admin@luxemoon.com.np'], 
      subject: `New Order #${order.id} from ${order.customerName}`,
      html: `
        <h1>New Order Received</h1>
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Total:</strong> NPR ${order.total}</p>
        <p><a href="https://luxemoon.com.np/admin">View in Dashboard</a></p>
      `
    });
    logger.info('Order notification email sent', { orderId: order.id });
  } catch (error) {
    logger.error('Email sending failed', error, { orderId: order.id });
    // Suppress error so order flow continues
  }
}

export async function sendOrderStatusSMS(phone: string, status: string, orderId: string) {
  if (!process.env.SPARROW_SMS_TOKEN) {
    logger.info(`Mocking SMS to ${phone}`, { orderId, status });
    return;
  }

  try {
    // Mock fetch implementation for Sparrow SMS
    // await fetch('http://api.sparrowsms.com/v2/sms/', ...)
    logger.info('Order status SMS sent', { orderId, phone, status });
  } catch (error) {
    logger.error('SMS sending failed', error, { orderId, phone });
    // Suppress error
  }
}