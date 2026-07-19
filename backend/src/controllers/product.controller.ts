import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { paginate, buildPrismaWhere, buildOrderBy, generateSlug } from '../utils/helpers';

export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '12', sort = 'newest', ...filters } = req.query as any;
    const { skip, take, page: p, limit: l } = paginate(parseInt(page), parseInt(limit));
    const where = buildPrismaWhere({ ...filters, isActive: true });
    const orderBy = buildOrderBy(sort as string);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          images: { orderBy: { displayOrder: 'asc' }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          variants: { where: { isActive: true }, select: { size: true, color: true, colorHex: true, stock: true, price: true } },
          reviews: { select: { rating: true } },
          _count: { select: { reviews: true, wishlistItems: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithDetails = products.map((product) => {
      const avgRating = product.reviews.length
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;
      return {
        ...product,
        reviews: undefined,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: product._count.reviews,
        wishlistCount: product._count.wishlistItems,
        primaryImage: product.images[0]?.url || null,
        inStock: product.variants.some((v) => v.stock > 0),
      };
    });

    res.json({
      success: true,
      data: productsWithDetails,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
        hasNext: p * l < total,
        hasPrev: p > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        videos: true,
        category: true,
        brand: true,
        variants: { where: { isActive: true } },
        reviews: {
          where: { isActive: true },
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        relatedProducts: {
          include: {
            related: {
              include: {
                images: { orderBy: { displayOrder: 'asc' }, take: 1 },
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
        _count: { select: { wishlistItems: true } },
        attributeValues: { include: { attribute: { include: { group: { select: { id: true, name: true, slug: true } } } } } },
      },
    });

    if (!product) throw new AppError('Product not found', 404);

    const p = product as any;
    const avgRating = p.reviews.length
      ? p.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / p.reviews.length
      : 0;

    const sizes = [...new Set(p.variants.filter((v: any) => v.size).map((v: any) => v.size))];
    const colors = [...new Set(p.variants.filter((v: any) => v.color).map((v: any) => JSON.stringify({ color: v.color, colorHex: v.colorHex })))].map((c) => JSON.parse(c as string));
    const totalStock = p.variants.reduce((sum: number, v: any) => sum + v.stock, 0);

    res.json({
      success: true,
      data: {
        ...p,
        variants: undefined,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: p.reviews.length,
        sizes,
        colors,
        availableVariants: p.variants,
        totalStock,
        inStock: totalStock > 0,
        attributeValues: p.attributeValues?.map((av: any) => ({
          id: av.id,
          attributeId: av.attributeId,
          value: av.value,
          attribute: {
            id: av.attribute.id,
            name: av.attribute.name,
            slug: av.attribute.slug,
            fieldType: av.attribute.fieldType,
            group: av.attribute.group,
          },
        })) || [],
        relatedProducts: p.relatedProducts.map((rp: any) => ({
          ...rp.related,
          primaryImage: rp.related.images[0]?.url || null,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { displayOrder: 'asc' }, take: 1 },
        category: { select: { id: true, name: true } },
        variants: { where: { isActive: true }, select: { stock: true } },
        _count: { select: { reviews: true } },
      },
    });

    res.json({
      success: true,
      data: products.map((p) => ({
        ...p,
        primaryImage: p.images[0]?.url || null,
        inStock: p.variants.some((v) => v.stock > 0),
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getNewArrivals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isNewArrival: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { displayOrder: 'asc' }, take: 1 },
        category: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      data: products.map((p) => ({ ...p, primaryImage: p.images[0]?.url || null })),
    });
  } catch (error) {
    next(error);
  }
};

export const getBestSellers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isBestSeller: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { displayOrder: 'asc' }, take: 1 },
        category: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      data: products.map((p) => ({ ...p, primaryImage: p.images[0]?.url || null })),
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isTrending: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { displayOrder: 'asc' }, take: 1 },
        category: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      data: products.map((p) => ({ ...p, primaryImage: p.images[0]?.url || null })),
    });
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q = '', limit = '10' } = req.query as any;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: parseInt(limit),
      include: {
        images: { orderBy: { displayOrder: 'asc' }, take: 1 },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: products.map((p) => ({
        id: p.id, name: p.name, slug: p.slug, price: p.basePrice,
        salePrice: p.salePrice, image: p.images[0]?.url || null,
        category: p.category.name, inStock: true,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const checkPincode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pincode = req.params.pincode as string;
    const deliverable = ['110001', '400001', '700001', '600001', '500001', '560001', '380001']
      .includes(pincode);
    res.json({
      success: true,
      data: {
        deliverable,
        message: deliverable ? 'Delivery available' : 'Sorry, we do not deliver to this pincode yet',
        estimatedDays: deliverable ? '3-5 business days' : null,
      },
    });
  } catch (error) {
    next(error);
  }
};
