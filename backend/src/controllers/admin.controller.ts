import { Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateSlug, paginate } from '../utils/helpers';
import { sendOrderStatusUpdate } from '../services/email.service';

// ============ DASHBOARD ============
export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [totalRevenue, monthRevenue, totalOrders, monthOrders, totalCustomers, totalProducts, lowStockProducts, recentOrders] = await Promise.all([
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'SUCCESS' } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'SUCCESS', createdAt: { gte: startOfMonth } } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.productVariant.count({ where: { stock: { lte: 10 }, isActive: true } }),
      prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } }, items: true } }),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.total || 0,
        monthRevenue: monthRevenue._sum.total || 0,
        totalOrders,
        monthOrders,
        totalCustomers,
        totalProducts,
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============ PRODUCTS ============
export const adminGetProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', search, categoryId, isActive } = req.query as any;
    const { skip, take, page: p, limit: l } = paginate(parseInt(page), parseInt(limit));
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
        include: {
          images: { take: 1, orderBy: { displayOrder: 'asc' } },
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          variants: { select: { stock: true, size: true, color: true } },
          _count: { select: { orderItems: true, reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products.map(p => ({ ...p, primaryImage: p.images[0]?.url || null })),
      pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    });
  } catch (error) {
    next(error);
  }
};

export const adminCreateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(500),
      description: z.string().min(1),
      shortDescription: z.string().optional(),
      categoryId: z.string().uuid(),
      brandId: z.string().uuid().optional(),
      gender: z.enum(['MEN', 'WOMEN', 'KIDS', 'ACCESSORIES']).optional(),
      basePrice: z.number().positive(),
      salePrice: z.number().positive().optional(),
      sku: z.string().min(1),
      isActive: z.boolean().default(true),
      isFeatured: z.boolean().default(false),
      isNewArrival: z.boolean().default(false),
      isBestSeller: z.boolean().default(false),
      isTrending: z.boolean().default(false),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      metaKeywords: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const slug = generateSlug(data.name) + '-' + Date.now().toString(36);

    const product = await prisma.product.create({
      data: { ...data, slug, discountPercent: data.salePrice ? Math.round(((data.basePrice - data.salePrice) / data.basePrice) * 100) : null },
      include: { category: true, images: true, variants: true },
    });

    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({
      name: z.string().min(1).max(500).optional(),
      description: z.string().min(1).optional(),
      shortDescription: z.string().optional(),
      categoryId: z.string().uuid().optional(),
      brandId: z.string().uuid().nullable().optional(),
      gender: z.enum(['MEN', 'WOMEN', 'KIDS', 'ACCESSORIES']).nullable().optional(),
      basePrice: z.number().positive().optional(),
      salePrice: z.number().positive().nullable().optional(),
      sku: z.string().min(1).optional(),
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      isNewArrival: z.boolean().optional(),
      isBestSeller: z.boolean().optional(),
      isTrending: z.boolean().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      metaKeywords: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new AppError('Product not found', 404);

    if (data.basePrice && data.salePrice) {
      (data as any).discountPercent = Math.round(((data.basePrice - data.salePrice) / data.basePrice) * 100);
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true, images: true, variants: true },
    });

    res.json({ success: true, message: 'Product updated', data: product });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (error) {
    next(error);
  }
};

// ============ CATEGORIES ============
export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { products: true, children: true } } },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      image: z.string().optional(),
      gender: z.enum(['MEN', 'WOMEN', 'KIDS', 'ACCESSORIES']).optional(),
      parentId: z.string().uuid().nullable().optional(),
      displayOrder: z.number().int().default(0),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const category = await prisma.category.create({ data: { ...data, slug: generateSlug(data.name) } });
    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      image: z.string().optional(),
      gender: z.enum(['MEN', 'WOMEN', 'KIDS', 'ACCESSORIES']).nullable().optional(),
      parentId: z.string().uuid().nullable().optional(),
      displayOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const category = await prisma.category.update({
      where: { id },
      data: { ...data, ...(data.name ? { slug: generateSlug(data.name) } : {}) },
    });
    res.json({ success: true, message: 'Category updated', data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ BRANDS ============
export const getBrands = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } });
    res.json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ name: z.string().min(1), description: z.string().optional(), logo: z.string().optional(), website: z.string().optional() });
    const data = schema.parse(req.body);
    const brand = await prisma.brand.create({ data: { ...data, slug: generateSlug(data.name) } });
    res.status(201).json({ success: true, message: 'Brand created', data: brand });
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({ name: z.string().min(1).optional(), description: z.string().optional(), logo: z.string().optional(), website: z.string().optional(), isActive: z.boolean().optional() });
    const data = schema.parse(req.body);
    const brand = await prisma.brand.update({ where: { id }, data });
    res.json({ success: true, message: 'Brand updated', data: brand });
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.brand.delete({ where: { id } });
    res.json({ success: true, message: 'Brand deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ BANNERS ============
export const getBanners = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { displayOrder: 'asc' }, include: { category: { select: { id: true, name: true } } } });
    res.json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      title: z.string().optional(), subtitle: z.string().optional(), description: z.string().optional(),
      image: z.string().min(1), mobileImage: z.string().optional(), link: z.string().optional(),
      buttonText: z.string().optional(), position: z.string().default('hero'),
      categoryId: z.string().uuid().optional(), displayOrder: z.number().int().default(0),
      startsAt: z.string().optional(), expiresAt: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const banner = await prisma.banner.create({
      data: { ...data, startsAt: data.startsAt ? new Date(data.startsAt) : null, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null },
    });
    res.status(201).json({ success: true, message: 'Banner created', data: banner });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({
      title: z.string().optional(), subtitle: z.string().optional(), description: z.string().optional(),
      image: z.string().optional(), mobileImage: z.string().optional(), link: z.string().optional(),
      buttonText: z.string().optional(), position: z.string().optional(),
      displayOrder: z.number().int().optional(), isActive: z.boolean().optional(),
      startsAt: z.string().nullable().optional(), expiresAt: z.string().nullable().optional(),
    });
    const data = schema.parse(req.body);
    const banner = await prisma.banner.update({
      where: { id },
      data: { ...data, startsAt: data.startsAt ? new Date(data.startsAt) : data.startsAt === null ? null : undefined, expiresAt: data.expiresAt ? new Date(data.expiresAt) : data.expiresAt === null ? null : undefined },
    });
    res.json({ success: true, message: 'Banner updated', data: banner });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.banner.delete({ where: { id } });
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ ORDERS (ADMIN) ============
export const adminGetOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', status, search } = req.query as any;
    const { skip, take, page: p, limit: l } = paginate(parseInt(page), parseInt(limit));
    const where: any = {};
    if (status) where.status = status;
    if (search) where.OR = [{ orderNumber: { contains: search, mode: 'insensitive' } }, { user: { name: { contains: search, mode: 'insensitive' } } }];

    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true } }, items: true, address: true } }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, data: orders, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({ status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED']), note: z.string().optional(), trackingNumber: z.string().optional() });
    const data = schema.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError('Order not found', 404);

    const updateData: any = { status: data.status };
    if (data.trackingNumber) updateData.trackingNumber = data.trackingNumber;
    if (data.status === 'DELIVERED') updateData.deliveredAt = new Date();

    const updated = await prisma.order.update({ where: { id }, data: updateData });
    await prisma.orderStatusHistory.create({ data: { orderId: id, status: data.status, note: data.note || `Status changed to ${data.status}`, changedBy: req.user!.email } });

    const orderUser = await prisma.user.findUnique({ where: { id: order.userId } });
    if (orderUser) {
      sendOrderStatusUpdate(order, orderUser, data.status).catch(console.error);
    }

    res.json({ success: true, message: 'Order updated', data: updated });
  } catch (error) {
    next(error);
  }
};

// ============ VERIFY PAYMENT (UPI/BANK) ============
export const adminVerifyPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError('Order not found', 404);
    const updated = await prisma.order.update({
      where: { id },
      data: { paymentStatus: 'SUCCESS', status: 'CONFIRMED' },
    });
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: 'CONFIRMED', note: 'Payment verified by admin' },
    });
    res.json({ success: true, message: 'Payment verified', data: updated });
  } catch (error) {
    next(error);
  }
};

// ============ COUPONS ============
export const validateCoupon = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code as string;
    const { subtotal } = req.query as any;
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive || coupon.expiresAt < new Date() || coupon.startsAt > new Date()) {
      throw new AppError('Invalid or expired coupon', 400);
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError('Coupon usage limit reached', 400);
    }
    const orderAmount = parseFloat(subtotal || '0');
    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      throw new AppError(`Minimum order amount of \u20B9${coupon.minOrderAmount} required`, 400);
    }
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (orderAmount * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      discount = Number(coupon.discountValue);
    }
    res.json({ success: true, data: { code: coupon.code, discount, type: coupon.discountType, value: coupon.discountValue, description: coupon.description } });
  } catch (error) {
    next(error);
  }
};

export const getCoupons = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      code: z.string().min(3).max(20).transform(v => v.toUpperCase()),
      description: z.string().optional(),
      discountType: z.enum(['PERCENTAGE', 'FIXED']),
      discountValue: z.number().positive(),
      minOrderAmount: z.number().positive().optional(),
      maxDiscount: z.number().positive().optional(),
      usageLimit: z.number().int().positive().optional(),
      perUserLimit: z.number().int().positive().default(1),
      startsAt: z.string(),
      expiresAt: z.string(),
    });
    const data = schema.parse(req.body);
    const coupon = await prisma.coupon.create({ data: { ...data, startsAt: new Date(data.startsAt), expiresAt: new Date(data.expiresAt) } });
    res.status(201).json({ success: true, message: 'Coupon created', data: coupon });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({
      code: z.string().min(3).max(20).transform(v => v.toUpperCase()).optional(),
      description: z.string().optional(), discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
      discountValue: z.number().positive().optional(), minOrderAmount: z.number().positive().nullable().optional(),
      maxDiscount: z.number().positive().nullable().optional(), usageLimit: z.number().int().positive().nullable().optional(),
      perUserLimit: z.number().int().positive().optional(), isActive: z.boolean().optional(),
      startsAt: z.string().optional(), expiresAt: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const coupon = await prisma.coupon.update({
      where: { id },
      data: { ...data, startsAt: data.startsAt ? new Date(data.startsAt) : undefined, expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined },
    });
    res.json({ success: true, message: 'Coupon updated', data: coupon });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.coupon.delete({ where: { id } });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ CUSTOMERS ============
export const adminGetCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', search } = req.query as any;
    const { skip, take, page: p, limit: l } = paginate(parseInt(page), parseInt(limit));
    const where: any = { role: 'CUSTOMER' };
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];

    const [customers, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true, _count: { select: { orders: true } } } }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: customers, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    next(error);
  }
};

// ============ ANALYTICS ============
export const getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { period = '30d' } = req.query as any;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const salesData = await prisma.order.findMany({
      where: { createdAt: { gte: startDate }, paymentStatus: 'SUCCESS' },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const categorySales = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, total: true },
      where: { order: { createdAt: { gte: startDate }, paymentStatus: 'SUCCESS' } },
    });

    const topProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { orderItems: { _count: 'desc' } },
      take: 10,
      include: { images: { take: 1, orderBy: { displayOrder: 'asc' } }, category: { select: { name: true } } },
    });

    const ordersByStatus = await prisma.order.groupBy({ by: ['status'], _count: true });

    res.json({
      success: true,
      data: {
        salesData,
        categorySales,
        topProducts: topProducts.map(p => ({ ...p, primaryImage: p.images[0]?.url || null })),
        ordersByStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============ SETTINGS ============
export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    const grouped = settings.reduce((acc, s) => {
      if (!acc[s.group]) acc[s.group] = {};
      acc[s.group][s.key] = s.value;
      return acc;
    }, {} as Record<string, Record<string, string>>);
    res.json({ success: true, data: grouped });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.record(z.string(), z.string());
    const data = schema.parse(req.body);

    for (const [key, value] of Object.entries(data)) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value, group: req.body._group || 'general' },
      });
    }

    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    next(error);
  }
};

// ============ BLOG ============
export const adminGetBlogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query as any;
    const { skip, take, page: p, limit: l } = paginate(parseInt(page), parseInt(limit));
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.blogPost.count(),
    ]);
    res.json({ success: true, data: posts, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    next(error);
  }
};

export const adminCreateBlog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ title: z.string().min(1), content: z.string().min(1), excerpt: z.string().optional(), coverImage: z.string().optional(), author: z.string().optional(), tags: z.array(z.string()).optional(), isPublished: z.boolean().default(false), metaTitle: z.string().optional(), metaDescription: z.string().optional() });
    const data = schema.parse(req.body);
    const post = await prisma.blogPost.create({ data: { ...data, tags: data.tags ? data.tags.join(',') : '', slug: generateSlug(data.title) + '-' + Date.now().toString(36), publishedAt: data.isPublished ? new Date() : null } });
    res.status(201).json({ success: true, message: 'Blog created', data: post });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateBlog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({ title: z.string().min(1).optional(), content: z.string().min(1).optional(), excerpt: z.string().optional(), coverImage: z.string().optional(), author: z.string().optional(), tags: z.array(z.string()).optional(), isPublished: z.boolean().optional(), metaTitle: z.string().optional(), metaDescription: z.string().optional() });
    const data = schema.parse(req.body);
    const updateData: any = { ...data };
    if (data.tags) updateData.tags = data.tags.join(',');
    if (data.title) updateData.slug = generateSlug(data.title) + '-' + Date.now().toString(36);
    if (data.isPublished && !data.isPublished) updateData.publishedAt = null;
    if (data.isPublished) updateData.publishedAt = new Date();
    const post = await prisma.blogPost.update({ where: { id }, data: updateData });
    res.json({ success: true, message: 'Blog updated', data: post });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteBlog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.blogPost.delete({ where: { id } });
    res.json({ success: true, message: 'Blog deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ NEWSLETTER ============
export const getSubscribers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const subscribers = await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: subscribers });
  } catch (error) {
    next(error);
  }
};

export const subscribe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      if (!existing.isActive) await prisma.subscriber.update({ where: { email }, data: { isActive: true } });
      return res.json({ success: true, message: 'Already subscribed' });
    }
    await prisma.subscriber.create({ data: { email } });
    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    next(error);
  }
};

// ============ FAQ ============
export const getFAQs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const faqs = await prisma.fAQ.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } });
    res.json({ success: true, data: faqs });
  } catch (error) {
    next(error);
  }
};

export const adminGetFAQs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const faqs = await prisma.fAQ.findMany({ orderBy: { displayOrder: 'asc' } });
    res.json({ success: true, data: faqs });
  } catch (error) {
    next(error);
  }
};

export const createFAQ = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ question: z.string().min(1), answer: z.string().min(1), category: z.string().optional(), displayOrder: z.number().int().default(0) });
    const data = schema.parse(req.body);
    const faq = await prisma.fAQ.create({ data });
    res.status(201).json({ success: true, message: 'FAQ created', data: faq });
  } catch (error) {
    next(error);
  }
};

export const updateFAQ = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({ question: z.string().optional(), answer: z.string().optional(), category: z.string().optional(), displayOrder: z.number().int().optional(), isActive: z.boolean().optional() });
    const data = schema.parse(req.body);
    const faq = await prisma.fAQ.update({ where: { id }, data });
    res.json({ success: true, message: 'FAQ updated', data: faq });
  } catch (error) {
    next(error);
  }
};

export const deleteFAQ = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.fAQ.delete({ where: { id } });
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ REVIEWS (ADMIN) ============
export const adminGetReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true } }, product: { select: { id: true, name: true, slug: true } } } });
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

export const adminToggleReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new AppError('Review not found', 404);
    const updated = await prisma.review.update({ where: { id }, data: { isActive: !review.isActive } });
    res.json({ success: true, message: `Review ${updated.isActive ? 'approved' : 'hidden'}`, data: updated });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.review.delete({ where: { id } });
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ POLICIES ============
export const getPolicies = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const policies = await prisma.policy.findMany();
    res.json({ success: true, data: policies });
  } catch (error) {
    next(error);
  }
};

export const updatePolicy = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const type = req.params.type as string;
    const schema = z.object({ title: z.string().min(1), content: z.string().min(1) });
    const data = schema.parse(req.body);
    const policy = await prisma.policy.upsert({ where: { type }, update: data, create: { type, ...data } });
    res.json({ success: true, message: 'Policy updated', data: policy });
  } catch (error) {
    next(error);
  }
};

// ============ CONTACT ============
export const getContactMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

export const submitContact = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ name: z.string().min(1), email: z.string().email(), phone: z.string().optional(), subject: z.string().min(1), message: z.string().min(1) });
    const data = schema.parse(req.body);
    const msg = await prisma.contactMessage.create({ data });
    res.status(201).json({ success: true, message: 'Message sent successfully', data: msg });
  } catch (error) {
    next(error);
  }
};

// ============ ROLES ============
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({ role: z.enum(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'EDITOR']), isActive: z.boolean().optional() });
    const data = schema.parse(req.body);
    const user = await prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true, isActive: true } });
    res.json({ success: true, message: 'User updated', data: user });
  } catch (error) {
    next(error);
  }
};

// ============ BACKUP ============
export const getBackups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const backups = await prisma.backup.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: backups });
  } catch (error) {
    next(error);
  }
};
