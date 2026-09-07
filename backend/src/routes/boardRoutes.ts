import { Router } from 'express';
import { BoardController } from '../controllers/boardController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public shared route (no auth required to view public board)
router.get('/shared/:shareCode', BoardController.getSharedBoard);

// Authenticated board routes
router.use(authenticate);

router.get('/', BoardController.getBoards);
router.post('/', BoardController.createBoard);
router.put('/:id', BoardController.updateBoard);
router.post('/:id/share', BoardController.shareBoard);
router.delete('/:id', BoardController.deleteBoard);

export default router;
