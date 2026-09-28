import webpush from 'web-push';
import { prisma } from '../utils/database';

// Fallback Production VAPID Keys (ensures fail-safe Web Push on Cloud deployments)
export const DEFAULT_VAPID_PUBLIC_KEY =
  'BAbqW8JmjXcbFRodpOYM4DXrR_ge2h-D2dYMBUmw5n8QUfezFjXbe738zCA4nsdoWmOezY39fo7p4NJjopc9SBA';
export const DEFAULT_VAPID_PRIVATE_KEY =
  'h8_7l6uJAWTHdz509r55OKmOwTaBmbrSvagsgL5eXew';
export const DEFAULT_VAPID_SUBJECT = 'mailto:support@noteonweb.com';

// Initialize VAPID details if configured
let isVapidConfigured = false;
function configureVapidIfNeeded() {
  const pub = process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY;
  const sub = process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT;

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
    const { pub, priv } = configureVapidIfNeeded();
    if (!pub || !priv || !isVapidConfigured) {
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
          const pushOptions = {
            TTL: 60 * 60 * 24, // 24 hours
            urgency: 'high' as const, // Wake up device from sleep/Doze mode immediately (RFC 8030)
          };
          await webpush.sendNotification(pushSubscription, payloadString, pushOptions);
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
    const { pub } = configureVapidIfNeeded();
    return pub || DEFAULT_VAPID_PUBLIC_KEY;
  }
}
