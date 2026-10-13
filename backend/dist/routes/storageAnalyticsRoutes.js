"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const storageAnalyticsController_1 = require("../controllers/storageAnalyticsController");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
// ล็อกความปลอดภัยระดับสูงสุด: เฉพาะ Super Admin เท่านั้นที่สามารถตรวจสอบข้อมูลการใช้พื้นที่ของผู้ใช้ได้
router.use(auth_1.authenticate);
router.use(authorize_1.requireSuperAdmin);
router.get('/summary', storageAnalyticsController_1.StorageAnalyticsController.getStorageSummary);
router.get('/users', storageAnalyticsController_1.StorageAnalyticsController.getUsersStorage);
router.get('/users/:userId', storageAnalyticsController_1.StorageAnalyticsController.getUserStorageDetail);
router.get('/orphaned', storageAnalyticsController_1.StorageAnalyticsController.getOrphanedFiles);
exports.default = router;
