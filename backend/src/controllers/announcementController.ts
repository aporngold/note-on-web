import { Response } from 'express';
import { prisma } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { emitBroadcast } from '../utils/socket';

export class AnnouncementController {
  /**
   * 1. GET /api/announcements/active
   * ดึงประกาศที่กำลังเปิดใช้งานล่าสุด สำหรับผู้ใช้ทุกคน (รวมทั้ง Desktop / Mobile)
   */
  static async getActiveAnnouncement(req: AuthRequest, res: Response) {
    try {
      const now = new Date();
      const activeAnnouncement = await prisma.announcement.findFirst({
        where: {
          isActive: true,
          OR: [
            { startDate: null },
            { startDate: { lte: now } },
          ],
          AND: [
            {
              OR: [
                { endDate: null },
                { endDate: { gte: now } },
              ],
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, username: true, email: true },
          },
        },
      });

      return res.json({
        success: true,
        announcement: activeAnnouncement || null,
      });
    } catch (error: any) {
      console.error('getActiveAnnouncement error:', error);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลประกาศระบบได้' });
    }
  }

  /**
   * 2. GET /api/announcements
   * ดึงรายการประกาศทั้งหมดในระบบ (เฉพาะ Super Admin หรือผู้มีสิทธิ์จัดการประกาศ)
   */
  static async getAllAnnouncements(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

      const [total, announcements] = await Promise.all([
        prisma.announcement.count(),
        prisma.announcement.findMany({
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, username: true, email: true },
            },
          },
        }),
      ]);

      return res.json({
        success: true,
        announcements,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          page,
          limit,
        },
      });
    } catch (error: any) {
      console.error('getAllAnnouncements error:', error);
      return res.status(500).json({ error: 'ไม่สามารถดึงรายการประกาศได้' });
    }
  }

  /**
   * 3. POST /api/announcements
   * สร้างประกาศระบบใหม่ (Super Admin หรือผู้ที่ Super Admin มอบสิทธิ์ให้)
   */
  static async createAnnouncement(req: AuthRequest, res: Response) {
    try {
      const {
        title,
        message,
        type = 'info',
        isActive = true,
        dismissible = true,
        linkText,
        linkUrl,
        startDate,
        endDate,
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'กรุณาระบุหัวข้อประกาศ' });
      }

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'กรุณาระบุเนื้อหาข้อความประกาศ' });
      }

      const validTypes = ['info', 'warning', 'critical', 'success'];
      const announcementType = validTypes.includes(type) ? type : 'info';

      const newAnnouncement = await prisma.announcement.create({
        data: {
          title: title.trim(),
          message: message.trim(),
          type: announcementType,
          isActive: Boolean(isActive),
          dismissible: Boolean(dismissible),
          linkText: linkText?.trim() || null,
          linkUrl: linkUrl?.trim() || null,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
          authorId: req.user?.id || null,
        },
        include: {
          author: {
            select: { id: true, username: true, email: true },
          },
        },
      });

      // แจ้งเตือนแบบ Real-time ไปยังทุกไคลเอนต์ที่ออนไลน์ทันทีผ่าน Socket.io
      emitBroadcast('system-announcement-updated', newAnnouncement);

      // บันทึกกิจกรรมลง Audit Log
      try {
        await prisma.auditLog.create({
          data: {
            adminId: req.user?.id || 'SYSTEM',
            action: 'CREATE_ANNOUNCEMENT',
            target: newAnnouncement.id,
            details: `สร้างประกาศ: "${newAnnouncement.title}" [${newAnnouncement.type}] (Active: ${newAnnouncement.isActive})`,
            ipAddress: (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 45),
            result: 'SUCCESS',
          },
        });
      } catch (logErr) {
        console.warn('AuditLog creation notice:', logErr);
      }

      return res.status(201).json({
        success: true,
        message: 'สร้างประกาศระบบเรียบร้อยแล้ว',
        announcement: newAnnouncement,
      });
    } catch (error: any) {
      console.error('createAnnouncement error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างประกาศระบบ' });
    }
  }

  /**
   * 4. PUT /api/announcements/:id
   * แก้ไขหรือเปิด/ปิดสถานะประกาศ (Super Admin หรือผู้มีสิทธิ์)
   */
  static async updateAnnouncement(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        title,
        message,
        type,
        isActive,
        dismissible,
        linkText,
        linkUrl,
        startDate,
        endDate,
      } = req.body;

      const existing = await prisma.announcement.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'ไม่พบประกาศที่ต้องการแก้ไข' });
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title.trim();
      if (message !== undefined) updateData.message = message.trim();
      if (type !== undefined) {
        const validTypes = ['info', 'warning', 'critical', 'success'];
        updateData.type = validTypes.includes(type) ? type : 'info';
      }
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);
      if (dismissible !== undefined) updateData.dismissible = Boolean(dismissible);
      if (linkText !== undefined) updateData.linkText = linkText?.trim() || null;
      if (linkUrl !== undefined) updateData.linkUrl = linkUrl?.trim() || null;
      if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

      const updated = await prisma.announcement.update({
        where: { id },
        data: updateData,
        include: {
          author: {
            select: { id: true, username: true, email: true },
          },
        },
      });

      // Real-time broadcast
      emitBroadcast('system-announcement-updated', updated);

      // Audit Log
      try {
        await prisma.auditLog.create({
          data: {
            adminId: req.user?.id || 'SYSTEM',
            action: 'UPDATE_ANNOUNCEMENT',
            target: updated.id,
            details: `แก้ไขประกาศ: "${updated.title}" (Active: ${updated.isActive})`,
            ipAddress: (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 45),
            result: 'SUCCESS',
          },
        });
      } catch (logErr) {
        console.warn('AuditLog creation notice:', logErr);
      }

      return res.json({
        success: true,
        message: 'อัปเดตประกาศระบบเรียบร้อยแล้ว',
        announcement: updated,
      });
    } catch (error: any) {
      console.error('updateAnnouncement error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตประกาศระบบ' });
    }
  }

  /**
   * 5. DELETE /api/announcements/:id
   * ลบประกาศระบบ (Super Admin หรือผู้มีสิทธิ์)
   */
  static async deleteAnnouncement(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.announcement.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'ไม่พบประกาศที่ต้องการลบ' });
      }

      await prisma.announcement.delete({ where: { id } });

      // แจ้ง Client ทราบว่าประกาศถูกนำออกแล้ว
      emitBroadcast('system-announcement-updated', { deletedId: id });

      // Audit Log
      try {
        await prisma.auditLog.create({
          data: {
            adminId: req.user?.id || 'SYSTEM',
            action: 'DELETE_ANNOUNCEMENT',
            target: id,
            details: `ลบประกาศ: "${existing.title}"`,
            ipAddress: (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 45),
            result: 'SUCCESS',
          },
        });
      } catch (logErr) {
        console.warn('AuditLog creation notice:', logErr);
      }

      return res.json({
        success: true,
        message: 'ลบประกาศระบบเรียบร้อยแล้ว',
      });
    } catch (error: any) {
      console.error('deleteAnnouncement error:', error);
      return res.status(500).json({ error: 'ไม่สามารถลบประกาศระบบได้' });
    }
  }
}
