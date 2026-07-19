import { Router } from 'express';
import { authenticate, authorizePermission } from '../middleware/auth';
import { upload, uploadProductImages } from '../controllers/upload.controller';

const router = Router();
router.use(authenticate);
router.use(authorizePermission('products.manage'));
router.post('/product-images', upload.array('images', 10), uploadProductImages);

export default router;
