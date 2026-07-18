import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import prisma from '../utils/prisma';
import { config } from '../config';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { sendPaymentConfirmation } from '../services/email.service';

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

const stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2024-11-20.acacia' as any });

export const createRazorpayOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      orderId: z.string().uuid(),
    });
    const { orderId } = schema.parse(req.body);

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.userId, paymentStatus: 'PENDING' },
    });
    if (!order) throw new AppError('Order not found or already paid', 404);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.total) * 100),
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: order.id },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    res.json({
      success: true,
      data: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: config.razorpay.keyId,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    });
    const data = schema.parse(req.body);

    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest('hex');

    if (signature !== data.razorpay_signature) {
      throw new AppError('Invalid payment signature', 400);
    }

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId: data.razorpay_order_id },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'SUCCESS',
          paymentId: data.razorpay_payment_id,
          status: 'CONFIRMED',
        },
      });
      await prisma.orderStatusHistory.create({
        data: { orderId: order.id, status: 'CONFIRMED', note: 'Payment received via Razorpay' },
      });

      const orderUser = await prisma.user.findUnique({ where: { id: order.userId } });
      if (orderUser) {
        sendPaymentConfirmation(order, orderUser).catch(console.error);
      }
    }

    res.json({ success: true, message: 'Payment verified' });
  } catch (error) {
    next(error);
  }
};

export const createStripePaymentIntent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ orderId: z.string().uuid() });
    const { orderId } = schema.parse(req.body);

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.userId, paymentStatus: 'PENDING' },
    });
    if (!order) throw new AppError('Order not found or already paid', 404);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.total) * 100),
      currency: 'inr',
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const stripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(req.body as string | Buffer, sig, config.stripe.webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'SUCCESS', paymentId: paymentIntent.id, status: 'CONFIRMED' },
        });
        await prisma.orderStatusHistory.create({
          data: { orderId, status: 'CONFIRMED', note: 'Payment received via Stripe' },
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Webhook error' });
  }
};
