import { Router } from 'express';
import { authenticate, authorizePermission } from '../middleware/auth';
import * as attr from '../controllers/attribute.controller';

const router = Router();

// Public route - get attributes for a subcategory (used by product form)
router.get('/public/subcategory/:subcategoryId', attr.getSubcategoryAttributesPublic);

// Admin routes
router.use(authenticate);
router.use(authorizePermission('products.manage'));

// Attribute Groups
router.get('/groups', attr.getAttributeGroups);
router.post('/groups', attr.createAttributeGroup);
router.put('/groups/:id', attr.updateAttributeGroup);
router.delete('/groups/:id', attr.deleteAttributeGroup);

// Attributes
router.get('/', attr.getAttributes);
router.post('/', attr.createAttribute);
router.put('/:id', attr.updateAttribute);
router.delete('/:id', attr.deleteAttribute);

// Subcategory Mappings
router.get('/subcategory/:subcategoryId', attr.getSubcategoryAttributes);
router.get('/subcategory-all', attr.getAllSubcategoryAttributes);
router.put('/subcategory/:subcategoryId', attr.setSubcategoryAttributes);

// Product Attribute Values
router.get('/product/:productId', attr.getProductAttributes);
router.put('/product/:productId', attr.setProductAttributes);

export default router;
