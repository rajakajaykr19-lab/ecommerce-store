import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, toggleWishlist } from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.post('/toggle', toggleWishlist);
router.delete('/:id', removeFromWishlist);

export default router;
