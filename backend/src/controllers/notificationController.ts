import { Response } from 'express';
import { prisma } from '../utils/database';
import { AuthRequest } from '../middleware/auth';

export class NotificationController {
  /**
   * Get notifications for the authenticated user
   */
  static async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const limit = parseInt((req.query.limit as string) || '30', 10);

      const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          include: {
            note: {
              select: { id: true, title: true, color: true, isArchived: true, isLocked: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        prisma.notification.count({
          where: { userId, isRead: false },
        }),
      ]);

      return res.json({
        success: true,
        notifications,
        unreadCount,
      });
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการแจ้งเตือนได้' });
    }
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        return res.status(404).json({ error: 'ไม่พบรายการแจ้งเตือน' });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return res.json({ success: true, notification: updated, unreadCount });
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      return res.status(500).json({ error: 'ไม่สามารถอัปเดตสถานะการแจ้งเตือนได้' });
    }
  }

  /**
   * Mark all notifications as read for current user
   */
  static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return res.json({ success: true, message: 'อ่านการแจ้งเตือนทั้งหมดแล้ว', unreadCount: 0 });
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        return res.status(404).json({ error: 'ไม่พบรายการแจ้งเตือน' });
      }

      await prisma.notification.delete({ where: { id } });

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return res.json({ success: true, message: 'ลบการแจ้งเตือนแล้ว', unreadCount });
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      return res.status(500).json({ error: 'ไม่สามารถลบการแจ้งเตือนได้' });
    }
  }

  /**
   * Delete all notifications for user
   */
  static async clearAllNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;

      await prisma.notification.deleteMany({
        where: { userId },
      });

      return res.json({ success: true, message: 'ล้างการแจ้งเตือนทั้งหมดแล้ว', unreadCount: 0 });
    } catch (err: any) {
      console.error('Error clearing notifications:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการล้างการแจ้งเตือน' });
    }
  }
}
