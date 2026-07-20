import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { validateTransition, ORDER_STATUSES } from '../utils/orderStateMachine';

const VALID_STATUSES = ORDER_STATUSES as unknown as [string, ...string[]];

// ============ BULK UPDATE STATUS ============
export const bulkUpdateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      orderIds: z.array(z.string().uuid()).min(1),
      status: z.enum(VALID_STATUSES),
      note: z.string().optional(),
    });
    const { orderIds, status, note } = schema.parse(req.body);

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
    });

    if (orders.length !== orderIds.length) {
      throw new AppError('One or more orders not found', 404);
    }

    let updatedCount = 0;
    const changedBy = req.user!.email;

    for (const order of orders) {
      if (!validateTransition(order.status, status)) {
        continue;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status },
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status,
          note: note || `Bulk status changed to ${status}`,
          changedBy,
        },
      });

      updatedCount++;
    }

    res.json({
      success: true,
      message: `${updatedCount} order(s) updated to ${status}`,
      data: { updatedCount },
    });
  } catch (error) {
    next(error);
  }
};

// ============ BULK CONFIRM ORDERS ============
export const bulkConfirmOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      orderIds: z.array(z.string().uuid()).min(1),
    });
    const { orderIds } = schema.parse(req.body);

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
    });

    if (orders.length !== orderIds.length) {
      throw new AppError('One or more orders not found', 404);
    }

    let confirmedCount = 0;
    const changedBy = req.user!.email;

    for (const order of orders) {
      if (order.status !== 'PENDING') continue;

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'CONFIRMED',
          note: 'Order confirmed in bulk',
          changedBy,
        },
      });

      confirmedCount++;
    }

    res.json({
      success: true,
      message: `${confirmedCount} order(s) confirmed`,
      data: { confirmedCount },
    });
  } catch (error) {
    next(error);
  }
};

// ============ BULK SHIP ORDERS ============
export const bulkShipOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      orderIds: z.array(z.string().uuid()).min(1),
      courierPartner: z.string().min(1),
      trackingNumbers: z.record(z.string().uuid(), z.string().min(1)),
    });
    const { orderIds, courierPartner, trackingNumbers } = schema.parse(req.body);

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { items: true },
    });

    if (orders.length !== orderIds.length) {
      throw new AppError('One or more orders not found', 404);
    }

    let shippedCount = 0;
    const changedBy = req.user!.email;

    for (const order of orders) {
      if (order.status !== 'CONFIRMED' && order.status !== 'PROCESSING') continue;

      const trackingNumber = trackingNumbers[order.id];
      if (!trackingNumber) {
        throw new AppError(`Tracking number required for order ${order.orderNumber}`, 400);
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'SHIPPED',
          trackingNumber,
          notes: `Shipped via ${courierPartner}`,
        },
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'SHIPPED',
          note: `Shipped via ${courierPartner} | Tracking: ${trackingNumber}`,
          changedBy,
        },
      });

      shippedCount++;
    }

    res.json({
      success: true,
      message: `${shippedCount} order(s) shipped`,
      data: { shippedCount },
    });
  } catch (error) {
    next(error);
  }
};

// ============ BULK CANCEL ORDERS ============
export const bulkCancelOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      orderIds: z.array(z.string().uuid()).min(1),
      reason: z.string().optional(),
    });
    const { orderIds, reason } = schema.parse(req.body);

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { items: true },
    });

    if (orders.length !== orderIds.length) {
      throw new AppError('One or more orders not found', 404);
    }

    let cancelledCount = 0;
    const changedBy = req.user!.email;

    for (const order of orders) {
      if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') continue;

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        });

        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: 'CANCELLED',
            note: reason || 'Cancelled in bulk',
            changedBy,
          },
        });
      });

      cancelledCount++;
    }

    res.json({
      success: true,
      message: `${cancelledCount} order(s) cancelled`,
      data: { cancelledCount },
    });
  } catch (error) {
    next(error);
  }
};

// ============ EXPORT ORDERS ============
export const exportOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, search, dateFrom, dateTo, paymentMethod } = req.query as Record<string, string | undefined>;
    const where: any = {};

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
        address: true,
      },
    });

    const exportData = orders.map((order) => ({
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      customerEmail: order.user.email,
      date: order.createdAt,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
      itemCount: order.items.length,
      items: order.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      address: order.address,
      trackingNumber: order.trackingNumber,
    }));

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    next(error);
  }
};
