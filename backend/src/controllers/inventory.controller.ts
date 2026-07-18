import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

const LOCK_DURATION_MINUTES = 15;

export const lockInventory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      sessionId: z.string().min(1),
      items: z.array(z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1),
      })).min(1),
    });
    const { sessionId, items } = schema.parse(req.body);

    await autoReleaseExpiredLocks();

    const locks = await prisma.$transaction(async (tx) => {
      const createdLocks = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant) throw new AppError('Variant not found', 404);

        const existingLock = await tx.stockLock.findFirst({
          where: {
            variantId: item.variantId,
            sessionId,
            expiresAt: { gt: new Date() },
          },
        });

        const otherLocks = await tx.stockLock.findMany({
          where: {
            variantId: item.variantId,
            expiresAt: { gt: new Date() },
            id: existingLock?.id ? { not: existingLock.id } : undefined,
          },
        });
        const lockedQty = otherLocks.reduce((sum: number, l: { quantity: number }) => sum + l.quantity, 0);
        if (variant.stock - lockedQty < item.quantity) {
          throw new AppError('Insufficient stock', 400);
        }

        if (existingLock) {
          const updated = await tx.stockLock.update({
            where: { id: existingLock.id },
            data: {
              quantity: item.quantity,
              expiresAt: new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000),
            },
          });
          createdLocks.push(updated);
        } else {
          const lock = await tx.stockLock.create({
            data: {
              variantId: item.variantId,
              sessionId,
              quantity: item.quantity,
              expiresAt: new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000),
            },
          });
          createdLocks.push(lock);
        }
      }

      return createdLocks;
    });

    res.status(201).json({
      success: true,
      message: 'Inventory locked',
      data: locks,
      expiresAt: new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000),
    });
  } catch (error) {
    next(error);
  }
};

export const releaseInventory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ sessionId: z.string().min(1) });
    const { sessionId } = schema.parse(req.body);

    const deleted = await prisma.stockLock.deleteMany({
      where: { sessionId },
    });

    res.json({ success: true, message: 'Inventory released', data: { released: deleted.count } });
  } catch (error) {
    next(error);
  }
};

export const confirmInventory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ sessionId: z.string().min(1) });
    const { sessionId } = schema.parse(req.body);

    const locks = await prisma.stockLock.findMany({
      where: { sessionId, expiresAt: { gt: new Date() } },
    });

    if (locks.length === 0) {
      throw new AppError('No active locks found', 404);
    }

    await prisma.$transaction(async (tx) => {
      for (const lock of locks) {
        const variant = await tx.productVariant.findUnique({ where: { id: lock.variantId } });
        if (!variant || variant.stock < lock.quantity) {
          throw new AppError('Insufficient stock for one or more items', 400);
        }
        await tx.productVariant.update({
          where: { id: lock.variantId },
          data: { stock: { decrement: lock.quantity } },
        });
      }

      await tx.stockLock.deleteMany({ where: { sessionId } });
    });

    res.json({ success: true, message: 'Inventory confirmed and stock decremented' });
  } catch (error) {
    next(error);
  }
};

async function autoReleaseExpiredLocks() {
  await prisma.stockLock.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
