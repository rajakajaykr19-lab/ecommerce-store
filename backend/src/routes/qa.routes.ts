import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getQuestions, askQuestion, upvoteQuestion } from '../controllers/qa.controller';

const router = Router();

router.get('/product/:productId', getQuestions);
router.post('/product/:productId', authenticate, askQuestion);
router.post('/:id/upvote', authenticate, upvoteQuestion);

export default router;
