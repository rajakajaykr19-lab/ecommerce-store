import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as invoice from '../controllers/invoice.controller';

const router = Router();

router.use(authenticate);

router.post('/generate/:orderId', invoice.generateInvoice);
router.get('/:orderNumber', invoice.getInvoice);
router.get('/html/:invoiceNumber', invoice.getInvoiceHTML);

export default router;
