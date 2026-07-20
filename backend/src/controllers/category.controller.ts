import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateSlug } from '../utils/helpers';

// ============ DASHBOARD STATS ============
export const getCategoryDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCategories,
      totalSubcategories,
      activeCategories,
      hiddenCategories,
      productsAssigned,
      thisMonthCategories,
      catsWithProducts,
      emptyCategories,
    ] = await Promise.all([
      prisma.category.count({ where: { parentId: null } }),
      prisma.category.count({ where: { parentId: { not: null } } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: false } }),
      prisma.product.count(),
      prisma.category.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Category" c WHERE EXISTS (SELECT 1 FROM "Product" p WHERE p."categoryId" = c.id)`,
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Category" c WHERE NOT EXISTS (SELECT 1 FROM "Product" p WHERE p."categoryId" = c.id)`,
    ]);

    res.json({
      success: true,
      data: {
        totalCategories,
        totalSubcategories,
        activeCategories,
        hiddenCategories,
        categoriesWithProducts: Number((catsWithProducts as any)[0]?.count ?? 0),
        emptyCategories: Number((emptyCategories as any)[0]?.count ?? 0),
        productsAssigned,
        thisMonthCategories,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============ GET CATEGORIES (ENHANCED) ============
export const getCategoriesEnhanced = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '50',
      search,
      status,
      parentId,
      dashboardFilter,
      sort = 'displayOrder',
      order = 'asc',
    } = req.query as Record<string, string>;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    if (parentId === 'none') where.parentId = null;
    else if (parentId) where.parentId = parentId;

    if (dashboardFilter === 'parent') {
      where.parentId = null;
    } else if (dashboardFilter === 'subcategory') {
      where.parentId = { not: null };
    } else if (dashboardFilter === 'active') {
      where.isActive = true;
    } else if (dashboardFilter === 'hidden') {
      where.isActive = false;
    } else if (dashboardFilter === 'thisMonth') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      where.createdAt = { gte: startOfMonth };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const orderBy: any = {};
    if (sort === 'name') orderBy.name = order;
    else if (sort === 'createdAt') orderBy.createdAt = order;
    else if (sort === 'updatedAt') orderBy.updatedAt = order;
    else orderBy.displayOrder = order;

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          _count: {
            select: { products: true, children: true, banners: true },
          },
          parent: { select: { id: true, name: true, slug: true } },
          children: {
            select: {
              id: true, name: true, slug: true, image: true, isActive: true, parentId: true,
              _count: { select: { products: true, children: true } },
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
      }),
      prisma.category.count({ where }),
    ]);

    // Server-side filtering for product-count-based filters
    let filtered = categories;
    if (dashboardFilter === 'withProducts') {
      filtered = categories.filter(cat => cat._count.products > 0);
    } else if (dashboardFilter === 'empty') {
      filtered = categories.filter(cat => cat._count.products === 0);
    }

    const categoriesWithHealth = filtered.map((cat) => {
      const healthIssues: string[] = [];
      if (!cat.image) healthIssues.push('Missing Image');
      if (!cat.description) healthIssues.push('Missing Description');
      if (!cat.metaTitle) healthIssues.push('Missing SEO');
      if (cat._count.products === 0 && cat._count.children === 0) healthIssues.push('Empty Category');
      if (!cat.isActive) healthIssues.push('Hidden');
      if (healthIssues.length === 0) healthIssues.push('Healthy');
      return { ...cat, healthIssues };
    });

    res.json({
      success: true,
      data: categoriesWithHealth,
      pagination: {
        page: parseInt(page),
        limit: take,
        total: dashboardFilter === 'withProducts' || dashboardFilter === 'empty' ? filtered.length : total,
        totalPages: Math.ceil((dashboardFilter === 'withProducts' || dashboardFilter === 'empty' ? filtered.length : total) / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============ GET CATEGORY BY ID ============
export const getCategoryById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, children: true, banners: true, descriptionTemplates: true },
        },
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          select: {
            id: true, name: true, slug: true, image: true, isActive: true, displayOrder: true,
            _count: { select: { products: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
        subcategoryAttributes: {
          include: {
            attribute: {
              include: { group: { select: { id: true, name: true, slug: true } } },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        descriptionTemplates: { orderBy: { displayOrder: 'asc' } },
        banners: { select: { id: true, title: true, isActive: true } },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const [productCount, orderItemAgg] = await Promise.all([
      prisma.product.count({ where: { categoryId: id } }),
      prisma.orderItem.aggregate({
        where: { product: { categoryId: id } },
        _count: true,
        _sum: { total: true },
      }),
    ]);

    const totalRevenue = orderItemAgg._sum?.total || 0;

    res.json({
      success: true,
      data: {
        ...category,
        analytics: {
          totalProducts: productCount,
          totalRevenue,
          totalOrders: orderItemAgg._count,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============ CREATE CATEGORY (ENHANCED) ============
export const createCategoryEnhanced = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(200),
      slug: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional(),
      gender: z.enum(['MEN', 'WOMEN', 'KIDS', 'ACCESSORIES']).optional(),
      parentId: z.string().uuid().nullable().optional(),
      displayOrder: z.number().int().default(0),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      status: z.enum(['draft', 'published', 'hidden', 'archived']).optional(),
    });

    const data = schema.parse(req.body);
    const slug = data.slug || generateSlug(data.name);

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new AppError('A category with this name/slug already exists', 409);
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        image: data.image,
        gender: data.gender,
        parentId: data.parentId || null,
        displayOrder: data.displayOrder,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        isActive: data.status !== 'hidden' && data.status !== 'archived',
      },
    });

    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (error) {
    next(error);
  }
};

// ============ UPDATE CATEGORY (ENHANCED) ============
export const updateCategoryEnhanced = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Category not found', 404);
    }

    const schema = z.object({
      name: z.string().min(1).max(200).optional(),
      slug: z.string().optional(),
      description: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      gender: z.enum(['MEN', 'WOMEN', 'KIDS', 'ACCESSORIES']).nullable().optional(),
      parentId: z.string().uuid().nullable().optional(),
      displayOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
      metaTitle: z.string().optional().nullable(),
      metaDescription: z.string().optional().nullable(),
      status: z.enum(['draft', 'published', 'hidden', 'archived']).optional(),
    });

    const data = schema.parse(req.body);

    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = data.slug || generateSlug(data.name);
      const slugExists = await prisma.category.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugExists) {
        throw new AppError('A category with this name/slug already exists', 409);
      }
    }

    if (data.parentId === id) {
      throw new AppError('A category cannot be its own parent', 400);
    }

    const updateData: any = { ...data };
    if (data.name) updateData.slug = slug;
    if (data.parentId !== undefined) updateData.parentId = data.parentId || null;
    if (data.status) {
      updateData.isActive = data.status !== 'hidden' && data.status !== 'archived';
    }
    delete updateData.status;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, message: 'Category updated', data: category });
  } catch (error) {
    next(error);
  }
};

// ============ DELETE CATEGORY (SAFE) ============
export const deleteCategorySafe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true, banners: true } },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    if (category._count.children > 0) {
      throw new AppError(
        `Cannot delete "${category.name}" - it has ${category._count.children} subcategory(ies). Remove or move them first.`,
        400
      );
    }

    if (category._count.products > 0) {
      throw new AppError(
        `Cannot delete "${category.name}" - it has ${category._count.products} product(s). Move them to another category first.`,
        400
      );
    }

    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ DUPLICATE CATEGORY ============
export const duplicateCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const original = await prisma.category.findUnique({ where: { id } });
    if (!original) {
      throw new AppError('Category not found', 404);
    }

    const duplicate = await prisma.category.create({
      data: {
        name: `${original.name} (Copy)`,
        slug: generateSlug(`${original.name}-copy`),
        description: original.description,
        image: original.image,
        gender: original.gender,
        parentId: original.parentId,
        displayOrder: original.displayOrder + 1,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        isActive: false,
      },
    });

    res.status(201).json({ success: true, message: 'Category duplicated', data: duplicate });
  } catch (error) {
    next(error);
  }
};

// ============ BULK OPERATIONS ============
export const bulkCategoryOperations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      action: z.enum(['publish', 'hide', 'archive', 'delete', 'changeParent', 'updateDisplayOrder']),
      categoryIds: z.array(z.string().uuid()).min(1),
      parentId: z.string().uuid().nullable().optional(),
      displayOrder: z.number().int().optional(),
    });

    const { action, categoryIds, parentId, displayOrder } = schema.parse(req.body);
    let affectedCount = 0;

    switch (action) {
      case 'publish':
        await prisma.category.updateMany({ where: { id: { in: categoryIds } }, data: { isActive: true } });
        affectedCount = categoryIds.length;
        break;

      case 'hide':
      case 'archive':
        await prisma.category.updateMany({ where: { id: { in: categoryIds } }, data: { isActive: false } });
        affectedCount = categoryIds.length;
        break;

      case 'delete': {
        const deletable: string[] = [];
        const skipped: string[] = [];

        for (const catId of categoryIds) {
          const counts = await prisma.category.findUnique({
            where: { id: catId },
            include: { _count: { select: { products: true, children: true } } },
          });
          if (counts && counts._count.products === 0 && counts._count.children === 0) {
            deletable.push(catId);
          } else {
            skipped.push(catId);
          }
        }

        if (deletable.length > 0) {
          await prisma.category.deleteMany({ where: { id: { in: deletable } } });
        }
        affectedCount = deletable.length;

        if (skipped.length > 0) {
          res.json({
            success: true,
            message: `${affectedCount} deleted. ${skipped.length} skipped (have products/subcategories).`,
            data: { affectedCount, skipped: skipped.length },
          });
          return;
        }
        break;
      }

      case 'changeParent':
        await prisma.category.updateMany({
          where: { id: { in: categoryIds } },
          data: { parentId: parentId || null },
        });
        affectedCount = categoryIds.length;
        break;

      case 'updateDisplayOrder':
        if (displayOrder !== undefined) {
          for (let i = 0; i < categoryIds.length; i++) {
            await prisma.category.update({
              where: { id: categoryIds[i] },
              data: { displayOrder: displayOrder + i },
            });
          }
          affectedCount = categoryIds.length;
        }
        break;
    }

    res.json({
      success: true,
      message: `${affectedCount} category(ies) ${action === 'delete' ? 'deleted' : 'updated'}`,
      data: { affectedCount },
    });
  } catch (error) {
    next(error);
  }
};

// ============ REORDER CATEGORIES ============
export const reorderCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      orderedIds: z.array(z.string().uuid()).min(1),
    });

    const { orderedIds } = schema.parse(req.body);

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { displayOrder: index },
        })
      )
    );

    res.json({ success: true, message: 'Categories reordered' });
  } catch (error) {
    next(error);
  }
};

// ============ GET ALL CATEGORIES (FLAT) ============
export const getAllCategoriesFlat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true, name: true, slug: true, parentId: true, isActive: true, displayOrder: true, image: true,
        _count: { select: { products: true, children: true } },
      },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};
