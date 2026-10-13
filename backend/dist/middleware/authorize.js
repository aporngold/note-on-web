"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireBroadcastPermission = exports.requireSuperAdmin = exports.requireAdmin = void 0;
const database_1 = require("../utils/database");
/**
 * Middleware ตรวจสอบสิทธิ์ระดับ ADMIN หรือ SUPER_ADMIN
 * หากเป็น USER ธรรมดา จะถูกปฏิเสธทันทีด้วยรหัส 403 Forbidden
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
    }
    const role = req.user.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return res.status(403).json({
            error: 'การเข้าถึงถูกปฏิเสธ: คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ (Admin Access Denied)',
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware ตรวจสอบสิทธิ์ระดับ SUPER_ADMIN เท่านั้น
 * ใช้สำหรับคำสั่งที่มีความเสี่ยงสูง เช่น การ Restore ฐานข้อมูล หรือการแต่งตั้งแอดมิน
 */
const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
    }
    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
            error: 'การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบขั้นสูงสุด (Super Admin) เท่านั้นที่สามารถทำรายการนี้ได้',
        });
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
/**
 * Middleware ตรวจสอบสิทธิ์สำหรับส่งประกาศระบบ (Broadcast Announcement)
 * อนุญาตสำหรับ:
 * 1. ผู้ใช้ที่เป็น SUPER_ADMIN
 * 2. หรือผู้ใช้ที่ได้รับมอบสิทธิ์ canBroadcast จาก Super Admin
 */
const requireBroadcastPermission = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
    }
    // Super Admin ได้รับสิทธิ์เสมอ
    if (req.user.role === 'SUPER_ADMIN') {
        return next();
    }
    if (req.user.canBroadcast) {
        return next();
    }
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: { role: true, canBroadcast: true },
        });
        if (user?.role === 'SUPER_ADMIN' || user?.canBroadcast) {
            req.user.canBroadcast = !!user.canBroadcast;
            return next();
        }
    }
    catch (err) {
        console.error('Error checking broadcast permission:', err);
    }
    return res.status(403).json({
        error: 'การเข้าถึงถูกปฏิเสธ: คุณไม่มีสิทธิ์จัดการประกาศระบบ (เฉพาะ Super Admin หรือผู้ที่ได้รับมอบหมายเท่านั้น)',
    });
};
exports.requireBroadcastPermission = requireBroadcastPermission;
