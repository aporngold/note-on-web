import { Response } from 'express';
import { prisma } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { WebPushService } from '../services/webPushService';

const reminderSchema = z.object({
  noteId: z.string().min(1, 'ต้องระบุ Note ID'),
  title: z.string().optional(),
  reminderDateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'รูปแบบวันเวลาไม่ถูกต้อง (ISO format required)',
  }),
  timezone: z.string().optional().default('Asia/Bangkok'),
  repeatRule: z.enum(['none', 'daily', 'weekly', 'monthly']).optional().default('none'),
});

const pushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url('Endpoint ต้องเป็น URL ที่ถูกต้อง'),
    keys: z.object({
      p256dh: z.string().min(1, 'ต้องมี p256dh key'),
      auth: z.string().min(1, 'ต้องมี auth key'),
    }),
  }),
  userAgent: z.string().optional(),
  deviceType: z.string().optional(),
});

export class ReminderController {
  /**
   * Get all active reminders for current user
   */
  static async getReminders(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const reminders = await prisma.reminder.findMany({
        where: { userId },
        include: {
          note: {
            select: { id: true, title: true, color: true, isArchived: true, isLocked: true },
          },
        },
        orderBy: { reminderDateTime: 'asc' },
      });
      return res.json({ success: true, reminders });
    } catch (err: any) {
      console.error('Error fetching reminders:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการแจ้งเตือนได้' });
    }
  }

  /**
   * Get reminder for a specific note
   */
  static async getReminderByNote(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { noteId } = req.params;

      const reminder = await prisma.reminder.findFirst({
        where: {
          noteId,
          userId,
          status: 'scheduled',
        },
      });

      return res.json({ success: true, reminder });
    } catch (err: any) {
      console.error('Error fetching note reminder:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลเตือนความจำของโน้ตได้' });
    }
  }

  /**
   * Create or update a reminder for a note
   */
  static async createOrUpdateReminder(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const parsed = reminderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' });
      }

      const { noteId, title, reminderDateTime, timezone, repeatRule } = parsed.data;

      // Verify note ownership
      const note = await prisma.note.findFirst({
        where: { id: noteId, userId },
      });

      if (!note) {
        return res.status(404).json({ error: 'ไม่พบโน้ตหรือคุณไม่มีสิทธิ์เข้าถึง' });
      }

      const parsedDate = new Date(reminderDateTime);

      // Check if reminder already exists for this note
      const existing = await prisma.reminder.findFirst({
        where: { noteId, userId },
      });

      let reminder;
      if (existing) {
        reminder = await prisma.reminder.update({
          where: { id: existing.id },
          data: {
            title: title || note.title || 'โน้ตเตือนความจำ',
            reminderDateTime: parsedDate,
            timezone,
            repeatRule,
            status: 'scheduled',
            cancelledAt: null,
            sentAt: null,
          },
        });
      } else {
        reminder = await prisma.reminder.create({
          data: {
            userId,
            noteId,
            title: title || note.title || 'โน้ตเตือนความจำ',
            reminderDateTime: parsedDate,
            timezone,
            repeatRule,
            status: 'scheduled',
          },
        });
      }

      return res.json({
        success: true,
        message: 'บันทึกการแจ้งเตือนเรียบร้อยแล้ว',
        reminder,
      });
    } catch (err: any) {
      console.error('Error setting reminder:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกการแจ้งเตือน' });
    }
  }

  /**
   * Delete or cancel a reminder
   */
  static async deleteReminder(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const reminder = await prisma.reminder.findFirst({
        where: { id, userId },
      });

      if (!reminder) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลการแจ้งเตือน' });
      }

      await prisma.reminder.delete({ where: { id } });

      return res.json({ success: true, message: 'ลบการแจ้งเตือนเรียบร้อยแล้ว' });
    } catch (err: any) {
      console.error('Error deleting reminder:', err);
      return res.status(500).json({ error: 'ไม่สามารถลบการแจ้งเตือนได้' });
    }
  }

  /**
   * Save client Web Push Subscription (Multi-device support per User)
   */
  static async subscribePush(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const parsed = pushSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'ข้อมูล Subscription ไม่ถูกต้อง' });
      }

      const { subscription, userAgent, deviceType } = parsed.data;

      // Upsert subscription by unique endpoint
      const savedSub = await prisma.pushSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        update: {
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent: userAgent || null,
          deviceType: deviceType || 'Desktop',
          lastUsedAt: new Date(),
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent: userAgent || null,
          deviceType: deviceType || 'Desktop',
        },
      });

      return res.json({
        success: true,
        message: 'ลงทะเบียนรับการแจ้งเตือนผ่าน Web Push เรียบร้อยแล้ว',
        subscriptionId: savedSub.id,
      });
    } catch (err: any) {
      console.error('Error subscribing push:', err);
      return res.status(500).json({ error: 'ไม่สามารถลงทะเบียนรับ Push Notification ได้' });
    }
  }

  /**
   * Unsubscribe / Remove Web Push Subscription
   */
  static async unsubscribePush(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ error: 'ต้องระบุ endpoint' });
      }

      await prisma.pushSubscription.deleteMany({
        where: { endpoint, userId },
      });

      return res.json({ success: true, message: 'ยกเลิกการรับแจ้งเตือนสำหรับอุปกรณ์นี้แล้ว' });
    } catch (err: any) {
      console.error('Error unsubscribing push:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการยกเลิกการรับแจ้งเตือน' });
    }
  }

  /**
   * Get VAPID Public Key for client subscription handshake
   */
  static async getVapidPublicKey(_req: any, res: Response) {
    const key = WebPushService.getPublicKey();
    return res.json({ success: true, publicKey: key });
  }
}
