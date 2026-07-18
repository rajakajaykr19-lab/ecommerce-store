import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { AuthRequest } from '../types';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/products'),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadProductImages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = (req as any).files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const urls = files.map((file) => ({
      url: `/uploads/products/${file.filename}`,
      filename: file.filename,
    }));
    res.json({ success: true, message: 'Images uploaded successfully', data: urls });
  } catch (error) {
    next(error);
  }
};
