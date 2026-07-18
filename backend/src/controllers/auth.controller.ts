import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { config } from '../config';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, email, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );
  const refreshToken = jwt.sign(
    { userId, email, role },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as any }
  );
  return { accessToken, refreshToken };
};

export const register = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already registered', 409);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    const tokens = generateTokens(user.id, user.email, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user, ...tokens },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError('Invalid email or password', 401);

    // Check account lockout
    const failedAttempts = (user as any).failedLoginAttempts || 0;
    const lockUntil = (user as any).lockUntil;
    if (lockUntil && new Date(lockUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(lockUntil).getTime() - Date.now()) / 60000);
      throw new AppError(`Account locked. Try again in ${remainingMinutes} minutes`, 423);
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      const attempts = failedAttempts + 1;
      const updateData: any = { failedLoginAttempts: attempts };
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
      await prisma.user.update({ where: { id: user.id }, data: updateData });
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        throw new AppError('Account locked due to too many failed attempts. Try again in 15 minutes', 423);
      }
      throw new AppError('Invalid email or password', 401);
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockUntil: null },
    });

    if (!user.isActive) throw new AppError('Account is deactivated', 403);

    const tokens = generateTokens(user.id, user.email, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id, name: user.name, email: user.email,
          phone: user.phone, role: user.role, avatar: user.avatar,
        },
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        avatar: true, isActive: true, createdAt: true, addresses: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(100).optional(),
      phone: z.string().optional(),
      avatar: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: { id: true, name: true, email: true, phone: true, avatar: true },
    });

    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8).max(100),
    });
    const data = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('User not found', 404);

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ refreshToken: z.string().min(1) });
    const { refreshToken } = schema.parse(req.body);

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) throw new AppError('Invalid token', 401);

    const tokens = generateTokens(user.id, user.email, user.role);
    res.json({ success: true, data: tokens });
  } catch (error) {
    next(new AppError('Invalid or expired refresh token', 401));
  }
};
