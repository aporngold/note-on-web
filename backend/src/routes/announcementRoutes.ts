import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcementController';
import { authenticate } from '../middleware/auth';
import { requireBroadcastPermission } from '../middleware/authorize';

const router = Router();

// ดึงประกาศที่กำลัง Active (ผู้ใช้ที่ล็อกอินแล้วทุกคนสามารถเข้าถึงได้)
router.get('/active', authenticate, AnnouncementController.getActiveAnnouncement);

// จัดการประกาศระบบ (เฉพาะ Super Admin หรือผู้ที่ได้รับมอบสิทธิ์ canBroadcast เท่านั้น)
router.get('/', authenticate, requireBroadcastPermission, AnnouncementController.getAllAnnouncements);
router.post('/', authenticate, requireBroadcastPermission, AnnouncementController.createAnnouncement);
router.put('/:id', authenticate, requireBroadcastPermission, AnnouncementController.updateAnnouncement);
router.delete('/:id', authenticate, requireBroadcastPermission, AnnouncementController.deleteAnnouncement);

export default router;
