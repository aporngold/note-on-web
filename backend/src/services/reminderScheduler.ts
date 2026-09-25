import cron from 'node-cron';
import { prisma } from '../utils/database';
import { WebPushService } from './webPushService';
import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;
let isSchedulerRunning = false;

export function setSchedulerSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

/**
 * Calculate the next reminder time based on the repeat rule
 */
function calculateNextOccurrence(currentDate: Date, repeatRule: string): Date {
  const next = new Date(currentDate);
  switch (repeatRule) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      break;
  }
  return next;
}

/**
 * Process due reminders with concurrency safety and deduplication
 */
export async function processDueReminders() {
  if (isSchedulerRunning) {
    return; // Prevent overlapping runs if previous iteration took longer
  }

  isSchedulerRunning = true;
  const now = new Date();

  try {
    // 1. Find all active reminders that are due
    const dueReminders = await prisma.reminder.findMany({
      where: {
        status: 'scheduled',
        reminderDateTime: {
          lte: now,
        },
      },
      include: {
        note: {
          select: {
            id: true,
            title: true,
            content: true,
            isArchived: true,
            isLocked: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
      take: 50, // Batch size to keep loop swift
    });

    if (dueReminders.length === 0) {
      return;
    }

    console.log(`⏰ [Reminder Scheduler] Found ${dueReminders.length} due reminders at ${now.toISOString()}`);

    for (const reminder of dueReminders) {
      // 2. Concurrency Lock: Mark as 'processing' to prevent other workers from picking it up
      const acquired = await prisma.reminder.updateMany({
        where: {
          id: reminder.id,
          status: 'scheduled', // Atomic check
        },
        data: {
          status: 'processing',
        },
      });

      if (acquired.count === 0) {
        continue; // Handled by another concurrent process
      }

      // 3. Check if associated note was archived/trashed
      if (reminder.note && reminder.note.isArchived) {
        console.log(`⏭️ Skipping reminder ${reminder.id} because note is archived in trash`);
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: 'cancelled', cancelledAt: now },
        });
        continue;
      }

      // Title & Message Preparation (Protect privacy: do not expose locked note content in notification)
      const noteTitle = reminder.title || reminder.note?.title || 'โน้ตเตือนความจำ';
      const notificationTitle = `🔔 เตือนความจำ: ${noteTitle}`;
      const notificationBody = `ถึงเวลาแจ้งเตือนโน้ตของคุณแล้ว`;
      const targetUrl = reminder.noteId ? `/notes/${reminder.noteId}` : '/dashboard';

      // 4. Create In-App Notification record
      const notification = await prisma.notification.create({
        data: {
          userId: reminder.userId,
          noteId: reminder.noteId,
          reminderId: reminder.id,
          title: notificationTitle,
          message: notificationBody,
        },
      });

      // 5. Emit real-time socket event to active sessions of this user
      if (ioInstance) {
        ioInstance.to(`user:${reminder.userId}`).emit('notification:new', notification);
        // Also broadcast to global note room if note is being edited
        if (reminder.noteId) {
          ioInstance.to(`note:${reminder.noteId}`).emit('notification:new', notification);
        }
      }

      // 6. Dispatch Web Push to all devices of the user
      await WebPushService.sendPushToUser(reminder.userId, {
        title: notificationTitle,
        body: notificationBody,
        url: targetUrl,
        noteId: reminder.noteId,
        reminderId: reminder.id,
        tag: `reminder-${reminder.id}`,
      });

      // 7. Update reminder recurrence or complete
      if (reminder.repeatRule && reminder.repeatRule !== 'none') {
        const nextTime = calculateNextOccurrence(reminder.reminderDateTime, reminder.repeatRule);
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: 'scheduled',
            reminderDateTime: nextTime,
            sentAt: now,
          },
        });
        console.log(`🔁 Recurring reminder ${reminder.id} scheduled for next cycle: ${nextTime.toISOString()}`);
      } else {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: 'sent',
            sentAt: now,
          },
        });
        console.log(`✅ Reminder ${reminder.id} sent successfully`);
      }
    }
  } catch (error) {
    console.error('Error running reminder scheduler cycle:', error);
  } finally {
    isSchedulerRunning = false;
  }
}

/**
 * Initialize Background Scheduler (Runs every 30 seconds)
 */
export function initReminderScheduler() {
  console.log('⏰ [Reminder Scheduler] Background scheduler initialized (every 30 seconds)');

  // Run immediately on boot to handle any reminders that became due while server was restarting
  processDueReminders().catch((err) => console.error('Initial reminder check error:', err));

  // Schedule to run every 30 seconds
  cron.schedule('*/30 * * * * *', () => {
    processDueReminders().catch((err) => console.error('Periodic reminder check error:', err));
  });
}
