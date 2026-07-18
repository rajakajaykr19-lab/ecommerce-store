import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      productId: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      title: z.string().max(200).optional(),
      comment: z.string().max(2000).optional(),
      images: z.array(z.string()).max(5).optional(),
    });
    const data = schema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new AppError('Product not found', 404);

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: data.productId, userId: req.user!.userId } },
    });
    if (existing) throw new AppError('You have already reviewed this product', 409);

    const hasOrdered = await prisma.orderItem.findFirst({
      where: { productId: data.productId, order: { userId: req.user!.userId, status: 'DELIVERED' } },
    });

    const review = await prisma.review.create({
      data: {
        ...data,
        images: data.images ? data.images.join(',') : '',
        userId: req.user!.userId,
        isVerified: !!hasOrdered,
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    res.status(201).json({ success: true, message: 'Review submitted', data: review });
  } catch (error) {
    next(error);
  }
};

export const getProductReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;
    const { page = '1', limit = '10' } = req.query as any;

    const reviews = await prisma.review.findMany({
      where: { productId, isActive: true },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    const total = await prisma.review.count({ where: { productId, isActive: true } });

    res.json({
      success: true,
      data: reviews,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};
