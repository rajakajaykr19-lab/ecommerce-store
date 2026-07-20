import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateOrderNumber } from '../utils/helpers';

const createRefundSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['RAZORPAY', 'STRIPE', 'BANK_TRANSFER', 'UPI', 'CASH']),
  reason: z.string().optional(),
  adminNotes: z.string().optional(),
});

const updateRefundStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  transactionId: z.string().optional(),
  failureReason: z.string().optional(),
});

export const createRefund = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = createRefundSchema.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id: body.orderId } });
    if (!order) throw new AppError('Order not found', 404);
    if (body.amount > order.total) throw new AppError('Refund amount cannot exceed order total', 400);

    const existingRefund = await prisma.refund.findFirst({ where: { orderId: body.orderId, status: { in: ['PENDING', 'PROCESSING'] } } });
    if (existingRefund) throw new AppError('A pending refund already exists for this order', 400);

    const refundNumber = 'REF-' + generateOrderNumber().replace('ORD-', '');

    const refund = await prisma.refund.create({
      data: {
        refundNumber,
        orderId: body.orderId,
        amount: body.amount,
        method: body.method,
        reason: body.reason,
        adminNotes: body.adminNotes,
        status: 'PENDING',
        processedBy: req.user!.email,
      },
    });

    res.status(201).json({ success: true, message: 'Refund created', data: refund });
  } catch (error) {
    next(error);
  }
};

export const getRefunds = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const orderId = req.query.orderId as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (orderId) where.orderId = orderId;
    if (search) {
      where.OR = [
        { refundNumber: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { order: { include: { user: { select: { id: true, name: true, email: true } }, items: true } } },
      }),
      prisma.refund.count({ where }),
    ]);

    res.json({
      success: true, data: refunds,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getRefundById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: { order: { include: { user: { select: { id: true, name: true, email: true } }, items: true, address: true } } },
    });
    if (!refund) throw new AppError('Refund not found', 404);
    res.json({ success: true, data: refund });
  } catch (error) {
    next(error);
  }
};

export const updateRefundStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const body = updateRefundStatusSchema.parse(req.body);

    const refund = await prisma.refund.findUnique({ where: { id }, include: { order: true } });
    if (!refund) throw new AppError('Refund not found', 404);

    const validTransitions: Record<string, string[]> = {
      PENDING: ['PROCESSING'], PROCESSING: ['COMPLETED', 'FAILED'], COMPLETED: [], FAILED: [],
    };
    if (!validTransitions[refund.status]?.includes(body.status)) {
      throw new AppError(`Cannot transition from ${refund.status} to ${body.status}`, 400);
    }

    const updateData: any = { status: body.status };
    if (body.status === 'PROCESSING') updateData.processedAt = new Date();
    else if (body.status === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.transactionId = body.transactionId;
      await prisma.order.update({ where: { id: refund.orderId }, data: { paymentStatus: 'REFUNDED', status: 'REFUNDED' } });
      await prisma.orderStatusHistory.create({ data: { orderId: refund.orderId, status: 'REFUNDED', note: `Refund ${refund.refundNumber} completed` } });
    } else if (body.status === 'FAILED') {
      updateData.failedAt = new Date();
      updateData.failureReason = body.failureReason;
    }

    const updated = await prisma.refund.update({ where: { id }, data: updateData });
    res.json({ success: true, message: 'Refund updated', data: updated });
  } catch (error) {
    next(error);
  }
};

export const getOrderRefunds = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orderId = req.query.orderId as string;
    if (!orderId) throw new AppError('orderId query parameter is required', 400);
    const refunds = await prisma.refund.findMany({ where: { orderId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: refunds });
  } catch (error) {
    next(error);
  }
};
