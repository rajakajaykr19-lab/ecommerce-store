import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(6).max(10),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false),
});

export const getAddresses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = addressSchema.parse(req.body);

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { ...data, userId: req.user!.userId },
    });

    res.status(201).json({ success: true, message: 'Address added', data: address });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = addressSchema.partial().parse(req.body);

    const id = req.params.id as string;
    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!existing) throw new AppError('Address not found', 404);

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data,
    });

    res.json({ success: true, message: 'Address updated', data: address });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const address = await prisma.address.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!address) throw new AppError('Address not found', 404);

    await prisma.address.delete({ where: { id: address.id } });
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    next(error);
  }
};
