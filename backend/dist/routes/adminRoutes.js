"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
// ล็อกความปลอดภัย: ทุก Route ภายใต้ /api/admin ต้องล็อกอินและมีสิทธิ์อย่างน้อย ADMIN
router.use(auth_1.authenticate);
router.use(authorize_1.requireAdmin);
// 1. ภาพรวมระบบ (Overview Stats)
router.get('/stats', adminController_1.AdminController.getStats);
// 2. จัดการผู้ใช้งาน (User Management)
router.get('/users', adminController_1.AdminController.getUsers);
router.get('/users/:id', adminController_1.AdminController.getUserDetail);
router.put('/users/:id/role', authorize_1.requireSuperAdmin, adminController_1.AdminController.updateUserRole);
router.delete('/users/:id', authorize_1.requireSuperAdmin, adminController_1.AdminController.deleteUser);
// 3. สถิติโน้ตและกระดาน (Notes & Boards Stats)
router.get('/notes/stats', adminController_1.AdminController.getNotesStats);
router.get('/boards/stats', adminController_1.AdminController.getBoardsStats);
// 4. ข้อมูลระบบฐานข้อมูล (Database System Info)
router.get('/database', adminController_1.AdminController.getDatabaseInfo);
// 5. ระบบสำรองข้อมูลและการกู้คืน (Backup & Restore Management)
router.get('/backups', adminController_1.AdminController.getBackupsList);
router.post('/backups/create', adminController_1.AdminController.triggerBackup);
router.get('/backups/:filename/download', adminController_1.AdminController.downloadBackup);
router.post('/backups/restore', authorize_1.requireSuperAdmin, adminController_1.AdminController.triggerRestore);
// 6. บันทึกประวัติกิจกรรม (Audit Logs)
router.get('/audit-logs', adminController_1.AdminController.getAuditLogs);
exports.default = router;
