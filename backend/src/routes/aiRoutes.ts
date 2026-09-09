import { Router } from 'express';
import { AiController } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/summarize', AiController.summarize);
router.post('/rewrite', AiController.rewrite);
router.post('/format', AiController.format);
router.get('/search', AiController.search);

export default router;
