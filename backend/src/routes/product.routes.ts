import { Router } from 'express';
import {
  getProducts, getProductBySlug, getFeaturedProducts, getNewArrivals,
  getBestSellers, getTrendingProducts, searchProducts, checkPincode,
  getDescriptionTemplates, getRecentlyPurchased, getSellerRating,
  getCompleteTheLook, getFrequentlyBoughtTogether,
} from '../controllers/product.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/trending', getTrendingProducts);
router.get('/description-templates/:categoryId', getDescriptionTemplates);
router.get('/recently-purchased/:productId', getRecentlyPurchased);
router.get('/seller-rating/:brandId', getSellerRating);
router.get('/look/:slug', getCompleteTheLook);
router.get('/together/:slug', getFrequentlyBoughtTogether);
router.get('/:slug', optionalAuth, getProductBySlug);

export default router;
