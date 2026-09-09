import { Router } from 'express';
import { VersionController } from '../controllers/versionController';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:noteId/versions', VersionController.getVersions);
router.post('/:noteId/versions', VersionController.createVersion);
router.post('/:noteId/versions/:versionId/restore', VersionController.restoreVersion);

export default router;
