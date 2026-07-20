import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateOrderNumber } from '../utils/helpers';
import { calculateGST } from '../utils/gstCalculator';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../services/email.service';

const createOrderSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.enum(['RAZORPAY', 'STRIPE', 'COD', 'UPI']),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  upiTxId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    quantity: z.number().int().min(1),
  })).min(1),
});

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const userId = req.user!.userId;

    const address = await prisma.address.findFirst({
      where: { id: data.addressId, userId },
    });
    if (!address) throw new AppError('Address not found', 404);

    let coupon = null;
    if (data.couponCode) {
      coupon = await prisma.coupon.findUnique({ where: { code: data.couponCode } });
      if (!coupon || !coupon.isActive || coupon.expiresAt < new Date() || coupon.startsAt > new Date()) {
        throw new AppError('Invalid or expired coupon', 400);
      }
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new AppError('Coupon usage limit reached', 400);
      }
    }

    let subtotal = 0;
    const orderItemsData: Array<{
      productId: string;
      variantId: string | null;
      name: string;
      sku: string;
      size: string | null;
      color: string | null;
      price: number;
      quantity: number;
      total: number;
      image: string | null;
      taxableValue: number;
      cgstAmount: number;
      sgstAmount: number;
      gstRate: number;
    }> = [];

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId, isActive: true },
        include: { variants: { where: { id: item.variantId || undefined } }, images: { take: 1, orderBy: { displayOrder: 'asc' } } },
      });
      if (!product) throw new AppError(`Product ${item.productId} not found`, 404);

      let price = product.salePrice || product.basePrice;
      let variant = null;
      if (item.variantId) {
        variant = product.variants[0];
        if (variant && variant.price) price = variant.price;
        if (variant && variant.stock < item.quantity) {
          throw new AppError(`Insufficient stock for ${product.name}`, 400);
        }
      }

      const itemTotal = Number(price) * item.quantity;
      subtotal += itemTotal;

      const gstRate = product.gstRate || 12;
      const { taxableValue, cgst, sgst } = calculateGST(Number(price), item.quantity, 0, gstRate);

      orderItemsData.push({
        productId: product.id,
        variantId: item.variantId || null,
        name: product.name,
        sku: product.sku,
        size: variant?.size || null,
        color: variant?.color || null,
        price,
        quantity: item.quantity,
        total: itemTotal,
        image: product.images[0]?.url || null,
        taxableValue,
        cgstAmount: cgst,
        sgstAmount: sgst,
        gstRate,
      });
    }

    let discount = 0;
    if (coupon) {
      if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
        throw new AppError(`Minimum order amount of ₹${coupon.minOrderAmount} required`, 400);
      }
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (subtotal * Number(coupon.discountValue)) / 100;
        if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
          discount = Number(coupon.maxDiscount);
        }
      } else {
        discount = Number(coupon.discountValue);
      }
    }

    const shipping = subtotal >= 499 ? 0 : 49;
    const tax = 0;
    const total = subtotal - discount + shipping + tax;

    const orderNumber = generateOrderNumber();
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: data.addressId,
          couponId: coupon?.id || null,
          subtotal,
          discount,
          shipping,
          tax,
          total,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          upiTxId: data.upiTxId || null,
          items: { create: orderItemsData },
          statusHistory: {
            create: { status: 'PENDING', note: 'Order placed' },
          },
        },
        include: { items: true, address: true },
      });

      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      for (const item of data.items) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (variant && variant.stock < item.quantity) {
            throw new AppError(`Insufficient stock for variant ${item.variantId}`, 400);
          }
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return newOrder;
    });

    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(`Order confirmed! Your order #${orderNumber} has been placed successfully. Total: ₹${total}`)}`;

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { ...order, whatsappLink },
    });

    sendOrderConfirmation(order, { name: req.user!.email, email: req.user!.email }).catch(console.error);
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', status } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = { userId: req.user!.userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          address: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderByNumber = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orderNumber = req.params.orderNumber as string;
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: { include: { product: { select: { slug: true, images: { take: 1, orderBy: { displayOrder: 'asc' } } } } } },
        address: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== req.user!.userId && req.user!.role === 'CUSTOMER') {
      throw new AppError('Unauthorized', 403);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orderNumber = req.params.orderNumber as string;
    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== req.user!.userId) throw new AppError('Unauthorized', 403);
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cancelledOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: 'CANCELLED', note: 'Cancelled by customer' },
      });

      const orderWithItems = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });

      if (orderWithItems) {
        for (const item of orderWithItems.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      return cancelledOrder;
    });

    res.json({ success: true, message: 'Order cancelled', data: updated });
  } catch (error) {
    next(error);
  }
};

export const trackOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orderNumber = req.params.orderNumber as string;
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        statusHistory: { orderBy: { createdAt: 'desc' } },
        items: true,
      },
    });

    if (!order) throw new AppError('Order not found', 404);

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
