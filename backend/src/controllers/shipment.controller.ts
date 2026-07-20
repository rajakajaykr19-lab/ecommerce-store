import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { sendOrderShipped } from '../services/email.service';

const createShipmentSchema = z.object({
  orderId: z.string().uuid(),
  courierPartner: z.string().min(1).optional(),
  courierPartnerId: z.string().min(1).optional(),
  trackingNumber: z.string().min(1),
  trackingUrl: z.string().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
}).refine((data) => data.courierPartner || data.courierPartnerId, { message: 'courierPartner or courierPartnerId is required' });

const updateShipmentSchema = z.object({
  status: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
  currentLocation: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  actualDelivery: z.string().optional(),
});

export const createShipment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createShipmentSchema.parse(req.body);
    const courierPartner = data.courierPartner || data.courierPartnerId!;
    const estimatedDeliveryDate = data.estimatedDelivery || data.estimatedDeliveryDate;

    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) throw new AppError('Order not found', 404);

    const validStatuses = ['CONFIRMED', 'PROCESSING', 'SHIPPED'];
    if (!validStatuses.includes(order.status)) {
      throw new AppError('Order must be at least CONFIRMED to create a shipment', 400);
    }

    const existingShipment = await prisma.shipment.findFirst({
      where: { orderId: data.orderId },
    });
    if (existingShipment) throw new AppError('Shipment already exists for this order', 400);

    const shipment = await prisma.$transaction(async (tx) => {
      const newShipment = await tx.shipment.create({
        data: {
          orderId: data.orderId,
          courierPartner,
          trackingNumber: data.trackingNumber,
          trackingUrl: data.trackingUrl || null,
          weight: data.weight || null,
          dimensions: data.dimensions || null,
          estimatedDelivery: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
          status: 'LABEL_CREATED',
        },
      });

      const orderUpdate: any = {
        courierPartner,
        trackingNumber: data.trackingNumber,
      };
      if (order.status !== 'SHIPPED') {
        orderUpdate.status = 'SHIPPED';
      }
      await tx.order.update({ where: { id: data.orderId }, data: orderUpdate });

      await tx.orderStatusHistory.create({
        data: {
          orderId: data.orderId,
          status: 'SHIPPED',
          note: `Shipment created with ${courierPartner} - ${data.trackingNumber}`,
          changedBy: req.user?.email || 'system',
        },
      });

      return newShipment;
    });

    res.status(201).json({ success: true, message: 'Shipment created', data: shipment });

    const orderWithUser = await prisma.order.findUnique({ where: { id: data.orderId }, include: { user: true, items: true } });
    if (orderWithUser?.user) {
      sendOrderShipped(orderWithUser, orderWithUser.user, shipment).catch(console.error);
    }
  } catch (error) {
    next(error);
  }
};

export const getShipments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', pageSize, status, courierPartner, courierPartnerId, search, startDate, endDate } = req.query as any;
    const effectiveLimit = parseInt(pageSize || limit);
    const skip = (parseInt(page) - 1) * effectiveLimit;
    const where: any = {};

    if (status) where.status = status;
    if (courierPartner || courierPartnerId) where.courierPartner = courierPartner || courierPartnerId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: effectiveLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              items: true,
            },
          },
        },
      }),
      prisma.shipment.count({ where }),
    ]);

    res.json({
      success: true,
      shipments,
      total,
      page: parseInt(page),
      pageSize: effectiveLimit,
      totalPages: Math.ceil(total / effectiveLimit),
    });
  } catch (error) {
    next(error);
  }
};

export const getShipmentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: true,
            address: true,
          },
        },
      },
    });

    if (!shipment) throw new AppError('Shipment not found', 404);

    res.json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

export const updateShipment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = updateShipmentSchema.parse(req.body);

    const existing = await prisma.shipment.findUnique({ where: { id } });
    if (!existing) throw new AppError('Shipment not found', 404);

    const updateData: any = { ...data };
    if (data.estimatedDelivery) {
      updateData.estimatedDelivery = new Date(data.estimatedDelivery);
    }
    if (data.actualDelivery) {
      updateData.actualDelivery = new Date(data.actualDelivery);
    }

    const shipment = await prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({ where: { id }, data: updateData });

      if (data.status === 'DELIVERED') {
        const deliveryTime = data.actualDelivery ? new Date(data.actualDelivery) : new Date();
        await tx.order.update({
          where: { id: existing.orderId },
          data: {
            status: 'DELIVERED',
            deliveredAt: deliveryTime,
          },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: existing.orderId,
            status: 'DELIVERED',
            note: `Order delivered via ${existing.courierPartner}`,
            changedBy: req.user?.email || 'system',
          },
        });
      }

      return updated;
    });

    res.json({ success: true, message: 'Shipment updated', data: shipment });
  } catch (error) {
    next(error);
  }
};

export const getOrderShipment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.query as { orderId: string };
    if (!orderId) throw new AppError('orderId query parameter is required', 400);

    const shipment = await prisma.shipment.findFirst({
      where: { orderId },
      include: {
        order: {
          include: {
            items: true,
            address: true,
          },
        },
      },
    });

    res.json({ success: true, data: shipment || null });
  } catch (error) {
    next(error);
  }
};

export const getCourierPartners = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const partners = [
      'Delhivery',
      'BlueDart',
      'DTDC',
      'Ekart',
      'XpressBees',
      'India Post',
      'Professional Courier',
      'Shadowfax',
      'Ecom Express',
      'Others',
    ];
    res.json({ success: true, data: partners });
  } catch (error) {
    next(error);
  }
};
