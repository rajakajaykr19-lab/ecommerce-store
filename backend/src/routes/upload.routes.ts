import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload, uploadProductImages } from '../controllers/upload.controller';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN', 'MANAGER'));
router.post('/product-images', upload.array('images', 10), uploadProductImages);

export default router;
