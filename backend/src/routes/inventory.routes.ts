import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as inventory from '../controllers/inventory.controller';

const router = Router();

router.use(authenticate);

router.post('/lock', inventory.lockInventory);
router.post('/release', inventory.releaseInventory);
router.post('/confirm', inventory.confirmInventory);

export default router;
