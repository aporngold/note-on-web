"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = exports.requireAdmin = void 0;
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
