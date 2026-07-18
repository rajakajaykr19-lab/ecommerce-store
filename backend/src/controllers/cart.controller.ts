import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cart = await prisma.cartItem.findMany({
      where: { userId: req.user!.userId },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            variants: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = cart.reduce((sum, item) => {
      const price = item.product.salePrice || item.product.basePrice;
      return sum + Number(price) * item.quantity;
    }, 0);

    res.json({
      success: true,
      data: { items: cart, total: Number(total.toFixed(2)) },
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional(),
      quantity: z.number().int().min(1).default(1),
    });
    const data = schema.parse(req.body);

    const product = await prisma.product.findUnique({
      where: { id: data.productId, isActive: true },
    });
    if (!product) throw new AppError('Product not found', 404);

    const existing = await prisma.cartItem.findFirst({
      where: {
        userId: req.user!.userId,
        productId: data.productId,
        variantId: data.variantId || null,
      },
    });

    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + data.quantity },
      });
      return res.json({ success: true, message: 'Cart updated', data: updated });
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        userId: req.user!.userId,
        productId: data.productId,
        variantId: data.variantId || null,
        quantity: data.quantity,
      },
      include: {
        product: {
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
      },
    });

    res.status(201).json({ success: true, message: 'Added to cart', data: cartItem });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ quantity: z.number().int().min(1).max(10) });
    const data = schema.parse(req.body);

    const id = req.params.id as string;
    const item = await prisma.cartItem.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!item) throw new AppError('Cart item not found', 404);

    const updated = await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: data.quantity },
    });

    res.json({ success: true, message: 'Cart updated', data: updated });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const item = await prisma.cartItem.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!item) throw new AppError('Cart item not found', 404);

    await prisma.cartItem.delete({ where: { id: item.id } });
    res.json({ success: true, message: 'Removed from cart' });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user!.userId } });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};
