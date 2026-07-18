import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

export const generateUUID = (): string => uuidv4();

export const generateSlug = (text: string): string =>
  slugify(text, { lower: true, strict: true, trim: true });

export const generateOrderNumber = (): string => {
  const prefix = 'ORD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
};

export const generateSKU = (category: string, name: string, variant?: string): string => {
  const prefix = category.substring(0, 3).toUpperCase();
  const namePart = name.substring(0, 4).toUpperCase();
  const variantPart = variant ? `-${variant.substring(0, 3).toUpperCase()}` : '';
  const unique = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${namePart}${variantPart}-${unique}`;
};

export const calculateDiscountPercent = (basePrice: number, salePrice: number): number => {
  if (!salePrice || salePrice >= basePrice) return 0;
  return Math.round(((basePrice - salePrice) / basePrice) * 100);
};

export const paginate = (page: number = 1, limit: number = 12) => {
  const p = Math.max(1, page);
  const l = Math.min(100, Math.max(1, limit));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

export const buildPrismaWhere = (filters: Record<string, any>) => {
  const where: Record<string, any> = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.gender) where.gender = filters.gender;
  if (filters.minPrice || filters.maxPrice) {
    where.basePrice = {};
    if (filters.minPrice) where.basePrice.gte = parseFloat(filters.minPrice);
    if (filters.maxPrice) where.basePrice.lte = parseFloat(filters.maxPrice);
  }
  if (filters.isActive !== undefined) where.isActive = filters.isActive === true || filters.isActive === 'true';
  if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured === true || filters.isFeatured === 'true';
  if (filters.isNewArrival !== undefined) where.isNewArrival = filters.isNewArrival === true || filters.isNewArrival === 'true';
  if (filters.isBestSeller !== undefined) where.isBestSeller = filters.isBestSeller === true || filters.isBestSeller === 'true';
  if (filters.isTrending !== undefined) where.isTrending = filters.isTrending === true || filters.isTrending === 'true';
  if (filters.discountPercent) where.discountPercent = { gte: parseInt(filters.discountPercent) };
  if (filters.rating) where.reviews = { some: { rating: { gte: parseInt(filters.rating) } } };
  if (filters.sizes) {
    where.variants = { some: { size: { in: filters.sizes.split(',').map((s: string) => s.trim()) } } };
  }
  if (filters.colors) {
    where.variants = { ...where.variants, some: { ...where.variants?.some, color: { in: filters.colors.split(',').map((c: string) => c.trim()) } } };
  }

  return where;
};

export const buildOrderBy = (sort: string = 'newest') => {
  switch (sort) {
    case 'price_asc': return { basePrice: 'asc' as const };
    case 'price_desc': return { basePrice: 'desc' as const };
    case 'name_asc': return { name: 'asc' as const };
    case 'name_desc': return { name: 'desc' as const };
    case 'rating': return { reviews: { _count: 'desc' as const } };
    case 'bestseller': return { isBestSeller: 'desc' as const };
    case 'newest':
    default: return { createdAt: 'desc' as const };
  }
};

export const getPublicUrl = (req: any, path: string): string => {
  return `${req.protocol}://${req.get('host')}/${path}`;
};
