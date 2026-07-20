import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateOrderNumber } from '../utils/helpers';
import { sendReturnRequestNotification, sendReturnStatusUpdate } from '../services/email.service';

const createReturnSchema = z.object({
  orderNumber: z.string().min(1),
  items: z.array(z.object({
    orderItemId: z.string().min(1),
    quantity: z.number().int().positive(),
    reason: z.string().min(1),
  })).min(1),
  description: z.string().optional(),
});

const updateReturnStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PICKUP_SCHEDULED', 'RETURNED', 'UNDER_INSPECTION', 'APPROVED_FOR_REFUND']),
  adminNotes: z.string().optional(),
  inspectionNotes: z.string().optional(),
  refundAmount: z.number().positive().optional(),
});

const statusTransitions: Record<string, string[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['PICKUP_SCHEDULED'],
  PICKUP_SCHEDULED: ['RETURNED'],
  RETURNED: ['UNDER_INSPECTION'],
  UNDER_INSPECTION: ['APPROVED_FOR_REFUND'],
};

export const createReturnRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const body = createReturnSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { orderNumber: body.orderNumber },
      include: { items: true },
    });

    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== userId) throw new AppError('Unauthorized to return this order', 403);
    if (order.status !== 'DELIVERED') throw new AppError('Only delivered orders can be returned', 400);

    for (const item of body.items) {
      const orderItem = order.items.find((i) => i.id === item.orderItemId);
      if (!orderItem) throw new AppError(`Order item ${item.orderItemId} not found in order`, 400);
      if (item.quantity > orderItem.quantity) throw new AppError(`Return quantity cannot exceed ordered quantity for ${orderItem.name}`, 400);
    }

    const returnNumber = 'RET-' + generateOrderNumber().replace('ORD-', '');

    const returnRequest = await prisma.return.create({
      data: {
        returnNumber,
        orderId: order.id,
        status: 'REQUESTED',
        reason: body.items.map(i => i.reason).join(', '),
        description: body.description,
        items: {
          create: body.items.map((item) => {
            const orderItem = order.items.find((i) => i.id === item.orderItemId)!;
            return {
              orderItemId: item.orderItemId,
              productId: orderItem.productId,
              quantity: item.quantity,
              reason: item.reason,
            };
          }),
        },
      },
      include: { items: true },
    });

    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: 'RETURNED', note: `Return requested: ${returnNumber}`, changedBy: req.user!.email },
    });

    const orderWithUser = await prisma.order.findUnique({ where: { id: order.id }, include: { user: true, items: true } });
    if (orderWithUser?.user) {
      sendReturnRequestNotification(orderWithUser, orderWithUser.user, returnRequest).catch(console.error);
    }

    res.status(201).json({ success: true, message: 'Return request created', data: returnRequest });
  } catch (error) {
    next(error);
  }
};

export const getReturnRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
        { returnNumber: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [returns, total, totalStats, requestedStats, approvedStats, rejectedStats] = await Promise.all([
      prisma.return.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderNumber: true, total: true, status: true, userId: true, createdAt: true } },
          items: true,
        },
      }),
      prisma.return.count({ where }),
      prisma.return.count(),
      prisma.return.count({ where: { status: 'REQUESTED' } }),
      prisma.return.count({ where: { status: 'APPROVED' } }),
      prisma.return.count({ where: { status: 'REJECTED' } }),
    ]);

    const returnsWithUser = await Promise.all(returns.map(async (r) => {
      const user = await prisma.user.findUnique({ where: { id: r.order.userId }, select: { id: true, name: true, email: true } });
      return { ...r, user };
    }));

    res.json({
      success: true, data: returnsWithUser,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: { total: totalStats, requested: requestedStats, approved: approvedStats, rejected: rejectedStats },
    });
  } catch (error) {
    next(error);
  }
};

export const getReturnById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const returnRequest = await prisma.return.findUnique({
      where: { id },
      include: { order: { include: { items: true, user: { select: { id: true, name: true, email: true, phone: true } } } }, items: true },
    });
    if (!returnRequest) throw new AppError('Return not found', 404);
    res.json({ success: true, data: returnRequest });
  } catch (error) {
    next(error);
  }
};

export const updateReturnStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const body = updateReturnStatusSchema.parse(req.body);

    const returnRequest = await prisma.return.findUnique({ where: { id }, include: { order: true } });
    if (!returnRequest) throw new AppError('Return not found', 404);

    const allowedTransitions = statusTransitions[returnRequest.status];
    if (!allowedTransitions || !allowedTransitions.includes(body.status)) {
      throw new AppError(`Cannot transition from ${returnRequest.status} to ${body.status}`, 400);
    }

    const updateData: any = { status: body.status };
    if (body.adminNotes) updateData.adminNotes = body.adminNotes;
    if (body.status === 'APPROVED' || body.status === 'REJECTED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user!.email;
    }
    if (body.status === 'UNDER_INSPECTION') {
      updateData.inspectedAt = new Date();
      updateData.inspectedBy = req.user!.email;
      if (body.inspectionNotes) updateData.inspectionNotes = body.inspectionNotes;
    }
    if (body.status === 'APPROVED_FOR_REFUND' && body.refundAmount) {
      updateData.refundAmount = body.refundAmount;
    }

    const updated = await prisma.return.update({ where: { id }, data: updateData, include: { items: true } });

    await prisma.orderStatusHistory.create({
      data: { orderId: returnRequest.orderId, status: 'RETURNED', note: `Return status: ${body.status}`, changedBy: req.user!.email },
    });

    const orderWithUser = await prisma.order.findUnique({ where: { id: returnRequest.orderId }, include: { user: true, items: true } });
    if (orderWithUser?.user) {
      sendReturnStatusUpdate(orderWithUser, orderWithUser.user, updated, body.status).catch(console.error);
    }

    res.json({ success: true, message: 'Return updated', data: updated });
  } catch (error) {
    next(error);
  }
};

export const getCustomerReturns = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = { order: { userId } };
    if (status) where.status = status;

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { order: { select: { id: true, orderNumber: true, total: true, status: true } }, items: true },
      }),
      prisma.return.count({ where }),
    ]);

    res.json({
      success: true, data: returns,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
