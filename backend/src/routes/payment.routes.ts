import { Router } from 'express';
import { createRazorpayOrder, verifyRazorpayPayment, createStripePaymentIntent, stripeWebhook } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/razorpay/create', authenticate, createRazorpayOrder);
router.post('/razorpay/verify', authenticate, verifyRazorpayPayment);
router.post('/stripe/create-intent', authenticate, createStripePaymentIntent);
router.post('/stripe/webhook', stripeWebhook);

export default router;
