import { Router } from 'express';
import { getProducts, getProductBySlug, getFeaturedProducts, getNewArrivals, getBestSellers, getTrendingProducts, searchProducts, checkPincode } from '../controllers/product.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/trending', getTrendingProducts);
router.get('/:slug', optionalAuth, getProductBySlug);
router.get('/pincode/:pincode', checkPincode);

export default router;
