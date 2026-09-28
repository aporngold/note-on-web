"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderController = void 0;
const database_1 = require("../utils/database");
const zod_1 = require("zod");
const webPushService_1 = require("../services/webPushService");
const socket_1 = require("../utils/socket");
const reminderSchema = zod_1.z.object({
    noteId: zod_1.z.string().min(1, 'ต้องระบุ Note ID'),
    title: zod_1.z.string().optional(),
    reminderDateTime: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'รูปแบบวันเวลาไม่ถูกต้อง (ISO format required)',
    }),
    timezone: zod_1.z.string().optional().default('Asia/Bangkok'),
    repeatRule: zod_1.z.enum(['none', 'daily', 'weekly', 'monthly']).optional().default('none'),
});
const pushSubscriptionSchema = zod_1.z.object({
    subscription: zod_1.z.object({
        endpoint: zod_1.z.string().url('Endpoint ต้องเป็น URL ที่ถูกต้อง'),
        keys: zod_1.z.object({
            p256dh: zod_1.z.string().min(1, 'ต้องมี p256dh key'),
            auth: zod_1.z.string().min(1, 'ต้องมี auth key'),
        }),
    }),
    userAgent: zod_1.z.string().optional(),
    deviceType: zod_1.z.string().optional(),
});
class ReminderController {
    /**
     * Get all active reminders for current user
     */
    static async getReminders(req, res) {
        try {
            const userId = req.userId;
            const reminders = await database_1.prisma.reminder.findMany({
                where: {
                    userId,
                    note: {
                        isArchived: false,
                    },
                },
                include: {
                    note: {
                        select: { id: true, title: true, color: true, isArchived: true, isLocked: true },
                    },
                },
                orderBy: { reminderDateTime: 'asc' },
            });
            return res.json({ success: true, reminders });
        }
        catch (err) {
            console.error('Error fetching reminders:', err);
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการแจ้งเตือนได้' });
        }
    }
    /**
     * Get reminder for a specific note
     */
    static async getReminderByNote(req, res) {
        try {
            const userId = req.userId;
            const { noteId } = req.params;
            const reminder = await database_1.prisma.reminder.findFirst({
                where: {
                    noteId,
                    userId,
                },
                orderBy: { updatedAt: 'desc' },
            });
            return res.json({ success: true, reminder });
        }
        catch (err) {
            console.error('Error fetching note reminder:', err);
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลเตือนความจำของโน้ตได้' });
        }
    }
    /**
     * Create or update a reminder for a note
     */
    static async createOrUpdateReminder(req, res) {
        try {
            const userId = req.userId;
            const parsed = reminderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' });
            }
            const { noteId, title, reminderDateTime, timezone, repeatRule } = parsed.data;
            // Verify note ownership
            const note = await database_1.prisma.note.findFirst({
                where: { id: noteId, userId },
            });
            if (!note) {
                return res.status(404).json({ error: 'ไม่พบโน้ตหรือคุณไม่มีสิทธิ์เข้าถึง' });
            }
            const parsedDate = new Date(reminderDateTime);
            // Check if reminder already exists for this note
            const existing = await database_1.prisma.reminder.findFirst({
                where: { noteId, userId },
            });
            let reminder;
            if (existing) {
                reminder = await database_1.prisma.reminder.update({
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
            }
            else {
                reminder = await database_1.prisma.reminder.create({
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
            (0, socket_1.emitToUser)(userId, 'reminder:changed', { action: 'saved', noteId, reminder });
            return res.json({
                success: true,
                message: 'บันทึกการแจ้งเตือนเรียบร้อยแล้ว',
                reminder,
            });
        }
        catch (err) {
            console.error('Error setting reminder:', err);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกการแจ้งเตือน' });
        }
    }
    /**
     * Delete or cancel a reminder
     */
    static async deleteReminder(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;
            const reminder = await database_1.prisma.reminder.findFirst({
                where: { id, userId },
            });
            if (!reminder) {
                return res.status(404).json({ error: 'ไม่พบข้อมูลการแจ้งเตือน' });
            }
            const noteId = reminder.noteId;
            await database_1.prisma.reminder.delete({ where: { id } });
            (0, socket_1.emitToUser)(userId, 'reminder:changed', { action: 'deleted', reminderId: id, noteId });
            return res.json({ success: true, message: 'ลบการแจ้งเตือนเรียบร้อยแล้ว', noteId });
        }
        catch (err) {
            console.error('Error deleting reminder:', err);
            return res.status(500).json({ error: 'ไม่สามารถลบการแจ้งเตือนได้' });
        }
    }
    /**
     * Save client Web Push Subscription (Multi-device support per User)
     */
    static async subscribePush(req, res) {
        try {
            const userId = req.userId;
            const parsed = pushSubscriptionSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.errors[0]?.message || 'ข้อมูล Subscription ไม่ถูกต้อง' });
            }
            const { subscription, userAgent, deviceType } = parsed.data;
            // Upsert subscription by unique endpoint
            const savedSub = await database_1.prisma.pushSubscription.upsert({
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
        }
        catch (err) {
            console.error('Error subscribing push:', err);
            return res.status(500).json({ error: 'ไม่สามารถลงทะเบียนรับ Push Notification ได้' });
        }
    }
    /**
     * Unsubscribe / Remove Web Push Subscription
     */
    static async unsubscribePush(req, res) {
        try {
            const userId = req.userId;
            const { endpoint } = req.body;
            if (!endpoint) {
                return res.status(400).json({ error: 'ต้องระบุ endpoint' });
            }
            await database_1.prisma.pushSubscription.deleteMany({
                where: { endpoint, userId },
            });
            return res.json({ success: true, message: 'ยกเลิกการรับแจ้งเตือนสำหรับอุปกรณ์นี้แล้ว' });
        }
        catch (err) {
            console.error('Error unsubscribing push:', err);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการยกเลิกการรับแจ้งเตือน' });
        }
    }
    /**
     * Get VAPID Public Key for client subscription handshake
     */
    static async getVapidPublicKey(_req, res) {
        const key = webPushService_1.WebPushService.getPublicKey();
        return res.json({ success: true, publicKey: key });
    }
    /**
     * Send an immediate test Web Push notification to user's registered devices
     */
    static async testPush(req, res) {
        try {
            const userId = req.userId;
            const subs = await database_1.prisma.pushSubscription.findMany({ where: { userId } });
            if (subs.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ยังไม่พบอุปกรณ์ที่ลงทะเบียนรับการแจ้งเตือนพุช (กรุณากดเปิดรับการแจ้งเตือนก่อน)',
                });
            }
            const result = await webPushService_1.WebPushService.sendPushToUser(userId, {
                title: '🔔 ทดสอบระบบแจ้งเตือนสำเร็จ!',
                body: 'ระบบ Web Push บนอุปกรณ์นี้เชื่อมต่อและทำงานได้สมบูรณ์แล้วครับ',
                url: '/dashboard',
                tag: `test-${Date.now()}`,
            });
            return res.json({
                success: true,
                message: `ส่งการแจ้งเตือนทดสอบสำเร็จไปยัง ${result.sent} เครื่อง`,
                sent: result.sent,
                failed: result.failed,
            });
        }
        catch (err) {
            console.error('Error sending test push:', err);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งแจ้งเตือนทดสอบ' });
        }
    }
}
exports.ReminderController = ReminderController;
