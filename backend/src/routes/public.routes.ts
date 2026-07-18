import { Router } from 'express';
import { getCategories, getBrands } from '../controllers/admin.controller';
import { getFAQs, getPolicies, getSettings, getBanners, getContactMessages, submitContact, subscribe, validateCoupon } from '../controllers/admin.controller';
import { adminGetBlogs } from '../controllers/admin.controller';

const router = Router();

// Public routes
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/banners', getBanners);
router.get('/faqs', getFAQs);
router.get('/policies', getPolicies);
router.get('/blog', adminGetBlogs);
router.get('/settings', getSettings);
router.get('/coupons/validate/:code', validateCoupon);
router.post('/contact', submitContact);
router.post('/subscribe', subscribe);

export default router;
