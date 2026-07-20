import { Router } from 'express';
import { createOrder, getOrders, getOrderByNumber, cancelOrder, trackOrder } from '../controllers/order.controller';
import { createReturnRequest, getCustomerReturns } from '../controllers/return.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/track/:orderNumber', trackOrder);
router.get('/:orderNumber', getOrderByNumber);
router.post('/:orderNumber/cancel', cancelOrder);

// Returns
router.post('/returns/request', createReturnRequest);
router.get('/returns/list', getCustomerReturns);

export default router;
