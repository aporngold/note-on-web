import { Router } from 'express';
import { ConnectionController } from '../controllers/connectionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', ConnectionController.getConnections);
router.post('/', ConnectionController.createConnection);
router.delete('/:id', ConnectionController.deleteConnection);

export default router;
