import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { paginate } from '../utils/helpers';

export const getQuestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;
    const { page = '1', limit = '20' } = req.query as any;
    const { skip, take, page: p, limit: l } = paginate(parseInt(page), parseInt(limit));

    const [questions, total] = await Promise.all([
      prisma.productQuestion.findMany({
        where: { productId, status: 'APPROVED' },
        skip,
        take,
        orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.productQuestion.count({ where: { productId, status: 'APPROVED' } }),
    ]);

    res.json({
      success: true,
      data: questions,
      pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l), hasNext: p < Math.ceil(total / l), hasPrev: p > 1 },
    });
  } catch (error) {
    next(error);
  }
};

export const askQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;
    const { question } = req.body;
    if (!question || question.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Question must be at least 5 characters' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const askedByName = req.user?.email || 'Anonymous';

    const q = await prisma.productQuestion.create({
      data: {
        productId,
        userId: req.user?.userId || null,
        question: question.trim(),
        askedByName,
        status: 'APPROVED',
      },
    });

    res.status(201).json({ success: true, data: q });
  } catch (error) {
    next(error);
  }
};

export const upvoteQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const q = await prisma.productQuestion.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });
    res.json({ success: true, data: q });
  } catch (error) {
    next(error);
  }
};
