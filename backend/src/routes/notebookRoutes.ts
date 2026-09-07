import { Router } from 'express';
import { NotebookController } from '../controllers/notebookController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', NotebookController.getNotebooks);
router.post('/', NotebookController.createNotebook);
router.put('/:id', NotebookController.updateNotebook);
router.delete('/:id', NotebookController.deleteNotebook);

export default router;
