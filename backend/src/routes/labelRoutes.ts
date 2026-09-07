import { Router } from 'express';
import { LabelController } from '../controllers/labelController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', LabelController.getLabels);
router.post('/', LabelController.createLabel);
router.put('/:id', LabelController.updateLabel);
router.delete('/:id', LabelController.deleteLabel);

export default router;
