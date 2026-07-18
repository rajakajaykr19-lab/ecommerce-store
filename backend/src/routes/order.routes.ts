import { Router } from 'express';
import { createOrder, getOrders, getOrderByNumber, cancelOrder, trackOrder } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/track/:orderNumber', trackOrder);
router.get('/:orderNumber', getOrderByNumber);
router.post('/:orderNumber/cancel', cancelOrder);

export default router;
