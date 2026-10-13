"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const announcementController_1 = require("../controllers/announcementController");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
// ดึงประกาศที่กำลัง Active (ผู้ใช้ที่ล็อกอินแล้วทุกคนสามารถเข้าถึงได้)
router.get('/active', auth_1.authenticate, announcementController_1.AnnouncementController.getActiveAnnouncement);
// จัดการประกาศระบบ (เฉพาะ Super Admin หรือผู้ที่ได้รับมอบสิทธิ์ canBroadcast เท่านั้น)
router.get('/', auth_1.authenticate, authorize_1.requireBroadcastPermission, announcementController_1.AnnouncementController.getAllAnnouncements);
router.post('/', auth_1.authenticate, authorize_1.requireBroadcastPermission, announcementController_1.AnnouncementController.createAnnouncement);
router.put('/:id', auth_1.authenticate, authorize_1.requireBroadcastPermission, announcementController_1.AnnouncementController.updateAnnouncement);
router.delete('/:id', auth_1.authenticate, authorize_1.requireBroadcastPermission, announcementController_1.AnnouncementController.deleteAnnouncement);
exports.default = router;
