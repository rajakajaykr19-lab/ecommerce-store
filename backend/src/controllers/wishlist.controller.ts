import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.userId },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            variants: { where: { isActive: true }, select: { stock: true, price: true } },
            category: { select: { id: true, name: true, slug: true } },
            _count: { select: { reviews: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          primaryImage: item.product.images[0]?.url || null,
          inStock: item.product.variants.some((v) => v.stock > 0),
          reviewCount: item.product._count.reviews,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ productId: z.string().uuid() });
    const { productId } = schema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found', 404);

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: req.user!.userId, productId } },
    });

    if (existing) {
      return res.json({ success: true, message: 'Already in wishlist' });
    }

    const item = await prisma.wishlistItem.create({
      data: { userId: req.user!.userId, productId },
    });

    res.status(201).json({ success: true, message: 'Added to wishlist', data: item });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const item = await prisma.wishlistItem.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!item) throw new AppError('Wishlist item not found', 404);

    await prisma.wishlistItem.delete({ where: { id: item.id } });
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ productId: z.string().uuid() });
    const { productId } = schema.parse(req.body);

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: req.user!.userId, productId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return res.json({ success: true, message: 'Removed from wishlist', data: { inWishlist: false } });
    }

    await prisma.wishlistItem.create({
      data: { userId: req.user!.userId, productId },
    });

    res.json({ success: true, message: 'Added to wishlist', data: { inWishlist: true } });
  } catch (error) {
    next(error);
  }
};
