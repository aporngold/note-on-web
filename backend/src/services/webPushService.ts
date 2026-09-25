import webpush from 'web-push';
import { prisma } from '../utils/database';

// Initialize VAPID details if configured
let isVapidConfigured = false;
function configureVapidIfNeeded() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const sub = process.env.VAPID_SUBJECT || 'mailto:support@noteonweb.com';

  if (pub && priv && !isVapidConfigured) {
    try {
      webpush.setVapidDetails(sub, pub, priv);
      isVapidConfigured = true;
      console.log('🔔 Web Push VAPID configuration initialized successfully');
    } catch (err) {
      console.error('Failed to configure Web Push VAPID details:', err);
    }
  }
  return { pub, priv };
}

configureVapidIfNeeded();

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  noteId?: string;
  reminderId?: string;
  tag?: string;
}

export class WebPushService {
  /**
   * Send a Web Push Notification to all active device subscriptions of a user
   */
  static async sendPushToUser(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<{ sent: number; failed: number }> {
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('Skipping Web Push: VAPID keys not configured');
      return { sent: 0, failed: 0 };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    const payloadString = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payloadString);
          sent++;
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { lastUsedAt: new Date() },
          });
        } catch (error: any) {
          failed++;
          console.warn(`Web push delivery failed for sub ${sub.id}:`, error.statusCode || error.message);

          // 410 Gone or 404 Not Found indicates subscription has expired or user revoked permission
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`🧹 Removing expired/unregistered push subscription: ${sub.id}`);
            try {
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            } catch (delErr) {
              // ignore
            }
          }
        }
      })
    );

    return { sent, failed };
  }

  /**
   * Get public VAPID key
   */
  static getPublicKey(): string {
    configureVapidIfNeeded();
    return process.env.VAPID_PUBLIC_KEY || '';
  }
}
