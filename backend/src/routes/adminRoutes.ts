import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireSuperAdmin } from '../middleware/authorize';

const router = Router();

// ล็อกความปลอดภัย: ทุก Route ภายใต้ /api/admin ต้องล็อกอินและมีสิทธิ์อย่างน้อย ADMIN
router.use(authenticate);
router.use(requireAdmin);

// 1. ภาพรวมระบบ (Overview Stats)
router.get('/stats', AdminController.getStats);

// 2. จัดการผู้ใช้งาน (User Management)
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserDetail);
router.put('/users/:id/role', requireSuperAdmin, AdminController.updateUserRole);
router.delete('/users/:id', requireSuperAdmin, AdminController.deleteUser);

// 3. สถิติโน้ตและกระดาน (Notes & Boards Stats)
router.get('/notes/stats', AdminController.getNotesStats);
router.get('/boards/stats', AdminController.getBoardsStats);

// 4. ข้อมูลระบบฐานข้อมูล (Database System Info)
router.get('/database', AdminController.getDatabaseInfo);

// 5. ระบบสำรองข้อมูลและการกู้คืน (Backup & Restore Management)
router.get('/backups', AdminController.getBackupsList);
router.post('/backups/create', AdminController.triggerBackup);
router.get('/backups/:filename/download', AdminController.downloadBackup);
router.post('/backups/restore', requireSuperAdmin, AdminController.triggerRestore);

// 6. บันทึกประวัติกิจกรรม (Audit Logs)
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
