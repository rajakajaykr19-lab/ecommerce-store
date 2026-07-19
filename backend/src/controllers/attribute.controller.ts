import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

// ============ ATTRIBUTE GROUPS ============
export const getAttributeGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const groups = await prisma.attributeGroup.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { attributes: true } } },
    });
    res.json({ success: true, data: groups });
  } catch (error) { next(error); }
};

export const createAttributeGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      displayOrder: z.number().optional(),
    });
    const data = schema.parse(req.body);
    const group = await prisma.attributeGroup.create({ data });
    res.status(201).json({ success: true, message: 'Attribute group created', data: group });
  } catch (error) { next(error); }
};

export const updateAttributeGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      displayOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const group = await prisma.attributeGroup.update({ where: { id }, data });
    res.json({ success: true, message: 'Attribute group updated', data: group });
  } catch (error) { next(error); }
};

export const deleteAttributeGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.attributeGroup.delete({ where: { id } });
    res.json({ success: true, message: 'Attribute group deleted' });
  } catch (error) { next(error); }
};

// ============ ATTRIBUTES ============
export const getAttributes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.query as any;
    const where: any = {};
    if (groupId) where.groupId = groupId;
    const attributes = await prisma.attribute.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: { group: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: attributes });
  } catch (error) { next(error); }
};

export const createAttribute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      groupId: z.string().min(1),
      name: z.string().min(1),
      slug: z.string().min(1),
      fieldType: z.enum(['text', 'textarea', 'select', 'multiselect', 'number', 'boolean']).default('text'),
      options: z.array(z.string()).optional(),
      required: z.boolean().optional(),
      filterable: z.boolean().optional(),
      searchable: z.boolean().optional(),
      displayOrder: z.number().optional(),
    });
    const data = schema.parse(req.body);
    const attribute = await prisma.attribute.create({
      data: { ...data, options: JSON.stringify(data.options || []) },
    });
    res.status(201).json({ success: true, message: 'Attribute created', data: attribute });
  } catch (error) { next(error); }
};

export const updateAttribute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const schema = z.object({
      name: z.string().min(1).optional(),
      fieldType: z.enum(['text', 'textarea', 'select', 'multiselect', 'number', 'boolean']).optional(),
      options: z.array(z.string()).optional(),
      required: z.boolean().optional(),
      filterable: z.boolean().optional(),
      searchable: z.boolean().optional(),
      displayOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const updateData: any = { ...data };
    if (data.options) updateData.options = JSON.stringify(data.options);
    const attribute = await prisma.attribute.update({ where: { id }, data: updateData });
    res.json({ success: true, message: 'Attribute updated', data: attribute });
  } catch (error) { next(error); }
};

export const deleteAttribute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.attribute.delete({ where: { id } });
    res.json({ success: true, message: 'Attribute deleted' });
  } catch (error) { next(error); }
};

// ============ SUBCATEGORY ATTRIBUTE MAPPINGS ============
export const getSubcategoryAttributes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const subcategoryId = req.params.subcategoryId as string;
    const mappings = await prisma.subcategoryAttribute.findMany({
      where: { subcategoryId },
      include: { attribute: { include: { group: true } } },
      orderBy: { displayOrder: 'asc' },
    });
    res.json({ success: true, data: mappings });
  } catch (error) { next(error); }
};

export const getAllSubcategoryAttributes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mappings = await prisma.subcategoryAttribute.findMany({
      include: {
        subcategory: { select: { id: true, name: true, slug: true } },
        attribute: { include: { group: { select: { id: true, name: true } } } },
      },
      orderBy: { displayOrder: 'asc' },
    });
    res.json({ success: true, data: mappings });
  } catch (error) { next(error); }
};

export const setSubcategoryAttributes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const subcategoryId = req.params.subcategoryId as string;
    const schema = z.object({
      attributes: z.array(z.object({
        attributeId: z.string(),
        required: z.boolean().optional(),
        displayOrder: z.number().optional(),
      })),
    });
    const data = schema.parse(req.body);

    await prisma.$transaction(async (tx) => {
      await tx.subcategoryAttribute.deleteMany({ where: { subcategoryId } });
      if (data.attributes.length > 0) {
        await tx.subcategoryAttribute.createMany({
          data: data.attributes.map((a) => ({
            subcategoryId,
            attributeId: a.attributeId,
            required: a.required || false,
            displayOrder: a.displayOrder || 0,
          })),
        });
      }
    });

    const result = await prisma.subcategoryAttribute.findMany({
      where: { subcategoryId },
      include: { attribute: true },
      orderBy: { displayOrder: 'asc' },
    });

    res.json({ success: true, message: 'Subcategory attributes updated', data: result });
  } catch (error) { next(error); }
};

// ============ PRODUCT ATTRIBUTE VALUES ============
export const getProductAttributes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;
    const values = await prisma.productAttributeValue.findMany({
      where: { productId },
      include: { attribute: { include: { group: true } } },
    });
    res.json({ success: true, data: values });
  } catch (error) { next(error); }
};

export const setProductAttributes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;
    const schema = z.object({
      attributes: z.array(z.object({
        attributeId: z.string(),
        value: z.string(),
      })),
    });
    const data = schema.parse(req.body);

    await prisma.$transaction(async (tx) => {
      await tx.productAttributeValue.deleteMany({ where: { productId } });
      if (data.attributes.length > 0) {
        await tx.productAttributeValue.createMany({
          data: data.attributes.map((a) => ({
            productId,
            attributeId: a.attributeId,
            value: a.value,
          })),
        });
      }
    });

    res.json({ success: true, message: 'Product attributes updated' });
  } catch (error) { next(error); }
};

// ============ PUBLIC: GET ATTRIBUTES FOR A SUBCATEGORY ============
export const getSubcategoryAttributesPublic = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const subcategoryId = req.params.subcategoryId as string;
    const mappings = await prisma.subcategoryAttribute.findMany({
      where: { subcategoryId, attribute: { isActive: true } },
      include: {
        attribute: {
          include: { group: { select: { id: true, name: true, slug: true } } },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
    const attributes = mappings.map((m) => ({
      ...m.attribute,
      options: (() => { try { return JSON.parse(m.attribute.options); } catch { return []; } })(),
      required: m.required,
      displayOrder: m.displayOrder,
      group: m.attribute.group,
    }));
    res.json({ success: true, data: attributes });
  } catch (error) { next(error); }
};
