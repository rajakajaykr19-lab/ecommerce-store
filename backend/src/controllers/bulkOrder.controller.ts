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

    const escapeCsv = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Order Number', 'Customer Name', 'Customer Email', 'Date', 'Status',
      'Payment Method', 'Payment Status', 'Subtotal', 'Discount', 'Shipping',
      'Tax', 'Total', 'Items', 'Tracking Number', 'Address',
    ];

    const rows = orders.map((order) => [
      order.orderNumber,
      order.user.name,
      order.user.email,
      new Date(order.createdAt).toLocaleDateString('en-IN'),
      order.status,
      order.paymentMethod,
      order.paymentStatus,
      order.subtotal,
      order.discount,
      order.shipping,
      order.tax,
      order.total,
      order.items.map((i) => `${i.name} x${i.quantity}`).join('; '),
      order.trackingNumber || '',
      order.address
        ? [order.address.line1, order.address.line2, order.address.city, order.address.state, order.address.pincode].filter(Boolean).join(', ')
        : '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
