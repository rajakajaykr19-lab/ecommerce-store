import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as admin from '../controllers/admin.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN', 'MANAGER'));

// Dashboard
router.get('/dashboard', admin.getDashboard);

// Products
router.get('/products', admin.adminGetProducts);
router.post('/products', admin.adminCreateProduct);
router.put('/products/:id', admin.adminUpdateProduct);
router.delete('/products/:id', admin.adminDeleteProduct);

// Categories
router.get('/categories', admin.getCategories);
router.post('/categories', admin.createCategory);
router.put('/categories/:id', admin.updateCategory);
router.delete('/categories/:id', admin.deleteCategory);

// Brands
router.get('/brands', admin.getBrands);
router.post('/brands', admin.createBrand);
router.put('/brands/:id', admin.updateBrand);
router.delete('/brands/:id', admin.deleteBrand);

// Banners
router.get('/banners', admin.getBanners);
router.post('/banners', admin.createBanner);
router.put('/banners/:id', admin.updateBanner);
router.delete('/banners/:id', admin.deleteBanner);

// Orders
router.get('/orders', admin.adminGetOrders);
router.put('/orders/:id/status', admin.adminUpdateOrderStatus);
router.put('/orders/:id/verify-payment', admin.adminVerifyPayment);

// Customers
router.get('/customers', admin.adminGetCustomers);

// Coupons
router.get('/coupons', admin.getCoupons);
router.post('/coupons', admin.createCoupon);
router.put('/coupons/:id', admin.updateCoupon);
router.delete('/coupons/:id', admin.deleteCoupon);

// Reviews
router.get('/reviews', admin.adminGetReviews);
router.put('/reviews/:id/toggle', admin.adminToggleReview);
router.delete('/reviews/:id', admin.adminDeleteReview);

// Blog
router.get('/blog', admin.adminGetBlogs);
router.post('/blog', admin.adminCreateBlog);
router.put('/blog/:id', admin.adminUpdateBlog);
router.delete('/blog/:id', admin.adminDeleteBlog);

// Settings
router.get('/settings', admin.getSettings);
router.put('/settings', admin.updateSettings);

// Policies
router.get('/policies', admin.getPolicies);
router.put('/policies/:type', admin.updatePolicy);

// Contact
router.get('/contact-messages', admin.getContactMessages);

// Newsletter
router.get('/subscribers', admin.getSubscribers);

// FAQ
router.get('/faqs', admin.adminGetFAQs);
router.post('/faqs', admin.createFAQ);
router.put('/faqs/:id', admin.updateFAQ);
router.delete('/faqs/:id', admin.deleteFAQ);

// Analytics
router.get('/analytics', admin.getAnalytics);

// Users / Roles
router.get('/users', admin.getUsers);
router.put('/users/:id/role', admin.updateUserRole);

// Backup
router.get('/backups', admin.getBackups);

export default router;
