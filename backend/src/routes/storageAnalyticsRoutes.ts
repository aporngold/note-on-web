import { Router } from 'express';
import { StorageAnalyticsController } from '../controllers/storageAnalyticsController';
import { authenticate } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/authorize';

const router = Router();

// ล็อกความปลอดภัยระดับสูงสุด: เฉพาะ Super Admin เท่านั้นที่สามารถตรวจสอบข้อมูลการใช้พื้นที่ของผู้ใช้ได้
router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/summary', StorageAnalyticsController.getStorageSummary);
router.get('/users', StorageAnalyticsController.getUsersStorage);
router.get('/users/:userId', StorageAnalyticsController.getUserStorageDetail);
router.get('/orphaned', StorageAnalyticsController.getOrphanedFiles);

export default router;
