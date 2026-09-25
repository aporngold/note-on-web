import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

/**
 * Middleware ตรวจสอบสิทธิ์ระดับ ADMIN หรือ SUPER_ADMIN
 * หากเป็น USER ธรรมดา จะถูกปฏิเสธทันทีด้วยรหัส 403 Forbidden
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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

/**
 * Middleware ตรวจสอบสิทธิ์ระดับ SUPER_ADMIN เท่านั้น
 * ใช้สำหรับคำสั่งที่มีความเสี่ยงสูง เช่น การ Restore ฐานข้อมูล หรือการแต่งตั้งแอดมิน
 */
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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
