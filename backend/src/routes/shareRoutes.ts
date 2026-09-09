import { Router } from 'express';
import { ShareController } from '../controllers/shareController';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

// Public route to view a shared note
router.get('/public/:code', ShareController.getPublicNote);

// Protected routes to manage share settings
router.get('/:noteId/settings', authenticate, ShareController.getShareSettings);
router.post('/:noteId', authenticate, ShareController.updateShareSettings);

export default router;
