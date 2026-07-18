import { Router } from 'express';
import { createReview, getProductReviews } from '../controllers/review.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, createReview);

export default router;
