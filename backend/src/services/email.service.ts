import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});

async function sendEmail(to: string, subject: string, html: string) {
  try {
    if (!config.smtp.user || config.smtp.user === 'your-email@gmail.com') {
      console.log('[Email] Skipping - SMTP not configured. Would send:', subject, 'to', to);
      return;
    }
    await transporter.sendMail({ from: config.smtp.from, to, subject, html });
    console.log('[Email] Sent:', subject, 'to', to);
  } catch (error) {
    console.error('[Email] Failed to send:', error);
  }
}

export async function sendOrderConfirmation(order: any, user: any) {
  const itemsHtml = order.items?.map((item: any) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td><td style="padding:8px;border-bottom:1px solid #eee">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee">₹${item.total}</td></tr>`
  ).join('') || '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#000;color:#C9A84C;padding:20px;text-align:center">
        <h1 style="margin:0;font-size:24px">Order Confirmed!</h1>
      </div>
      <div style="padding:20px">
        <p>Hi ${user.name},</p>
        <p>Your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:left">Qty</th><th style="padding:8px;text-align:left">Total</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="border-top:2px solid #000;padding-top:16px;margin-top:16px">
          <p><strong>Subtotal:</strong> ₹${order.subtotal}</p>
          ${order.discount > 0 ? `<p><strong>Discount:</strong> -₹${order.discount}</p>` : ''}
          <p><strong>Shipping:</strong> ${order.shipping === 0 ? 'FREE' : '₹' + order.shipping}</p>
          <p style="font-size:18px"><strong>Total:</strong> ₹${order.total}</p>
        </div>
        <p style="color:#666;margin-top:16px">Payment Method: ${order.paymentMethod}</p>
        <p style="color:#666">We'll send you shipping updates soon.</p>
      </div>
      <div style="background:#f5f5f5;padding:16px;text-align:center;color:#666;font-size:12px">
        <p>STORE NAME - Premium Fashion</p>
      </div>
    </div>`;
  
  await sendEmail(user.email, `Order Confirmed #${order.orderNumber}`, html);
}

export async function sendPaymentConfirmation(order: any, user: any) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#000;color:#C9A84C;padding:20px;text-align:center">
        <h1 style="margin:0;font-size:24px">Payment Received!</h1>
      </div>
      <div style="padding:20px">
        <p>Hi ${user.name},</p>
        <p>We've received payment of <strong>₹${order.total}</strong> for order <strong>#${order.orderNumber}</strong>.</p>
        <p>Your order is now being processed.</p>
      </div>
    </div>`;
  await sendEmail(user.email, `Payment Received - Order #${order.orderNumber}`, html);
}

export async function sendOrderStatusUpdate(order: any, user: any, newStatus: string) {
  const statusMessages: Record<string, string> = {
    CONFIRMED: 'Your order has been confirmed and is being prepared.',
    PROCESSING: 'Your order is now being processed.',
    SHIPPED: `Your order has been shipped! ${order.trackingNumber ? 'Tracking: ' + order.trackingNumber : ''}`,
    DELIVERED: 'Your order has been delivered. We hope you enjoy your purchase!',
    CANCELLED: 'Your order has been cancelled.',
  };

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#000;color:#C9A84C;padding:20px;text-align:center">
        <h1 style="margin:0;font-size:24px">Order Update</h1>
      </div>
      <div style="padding:20px">
        <p>Hi ${user.name},</p>
        <p>Your order <strong>#${order.orderNumber}</strong> status has been updated to <strong>${newStatus}</strong>.</p>
        <p>${statusMessages[newStatus] || ''}</p>
      </div>
    </div>`;
  await sendEmail(user.email, `Order #${order.orderNumber} - ${newStatus}`, html);
}
