import api from './api';

/**
 * Convert URL-safe base64 string to Uint8Array for applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register Service Worker for Note on Web
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Get current push subscription from browser if exists
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (err) {
    console.warn('Error checking push subscription:', err);
    return null;
  }
}

/**
 * Detect client device type
 */
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'Tablet';
  }
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

/**
 * Check if the user is using an iOS / iPadOS device
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Check if web app is running in Standalone PWA mode (added to Home Screen)
 */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as any).standalone)
  );
}

/**
 * Check if the user is using an Android device
 */
export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Request notification permission and subscribe to Web Push
 */
export async function subscribeToWebPush(): Promise<{ success: boolean; error?: string }> {
  if (isIOSDevice() && !isStandalonePWA()) {
    return {
      success: false,
      error: 'สำหรับ iPhone/iPad: กรุณากดปุ่มแชร์ 📤 แล้วเลือก "เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)" ก่อนเปิดรับการแจ้งเตือนตามกฎของ Apple',
    };
  }

  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, error: 'เบราว์เซอร์นี้ไม่รองรับระบบ Web Push Notification' };
  }

  try {
    // 1. Check or request permission
    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return { success: false, error: 'คุณได้ปฏิเสธการอนุญาตแจ้งเตือน (กรุณาเปิดการแจ้งเตือนในการตั้งค่าเบราว์เซอร์)' };
    }

    const DEFAULT_VAPID_PUBLIC_KEY =
      'BAbqW8JmjXcbFRodpOYM4DXrR_ge2h-D2dYMBUmw5n8QUfezFjXbe738zCA4nsdoWmOezY39fo7p4NJjopc9SBA';

    // 2. Fetch VAPID Public Key from server
    let publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      try {
        const res = await api.get('/reminders/vapid-key');
        if (res.data?.publicKey) {
          publicKey = res.data.publicKey;
        }
      } catch (keyErr) {
        console.warn('Could not fetch VAPID key from API, falling back to default:', keyErr);
      }
    }

    if (!publicKey) {
      publicKey = DEFAULT_VAPID_PUBLIC_KEY;
    }

    // 3. Register service worker and ensure it is ready
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    const convertedKey = urlBase64ToUint8Array(publicKey);

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as unknown as BufferSource,
      });
    }

    // 4. Send subscription to server
    const subJSON = subscription.toJSON();
    if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
      return { success: false, error: 'ข้อมูล Push Subscription ไม่สมบูรณ์' };
    }

    const subRes = await api.post('/reminders/subscribe', {
      subscription: {
        endpoint: subJSON.endpoint,
        keys: {
          p256dh: subJSON.keys.p256dh,
          auth: subJSON.keys.auth,
        },
      },
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
    });

    console.log('🔔 [WebPush] Subscribed device successfully:', subRes.data);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to subscribe to Web Push:', err);
    return { success: false, error: err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการลงทะเบียนรับการแจ้งเตือน' };
  }
}

/**
 * Trigger immediate test Web Push notification to current device
 */
export async function sendTestWebPush(): Promise<{ success: boolean; message?: string; devicesCount?: number; error?: string }> {
  try {
    // 1. Ensure current device is subscribed
    const subResult = await subscribeToWebPush();
    if (!subResult.success) {
      return { success: false, error: subResult.error };
    }

    // 2. Request backend to trigger test push
    const res = await api.post('/reminders/test-push');
    return {
      success: true,
      message: res.data?.message || 'ส่งแจ้งเตือนทดสอบเรียบร้อยแล้ว',
      devicesCount: res.data?.sent,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.error || err.message || 'ส่งแจ้งเตือนทดสอบไม่สำเร็จ',
    };
  }
}

/**
 * Unsubscribe from Web Push
 */
export async function unsubscribeFromWebPush(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      try {
        await api.post('/reminders/unsubscribe', { endpoint });
      } catch (e) {
        // ignore
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to unsubscribe from Web Push:', err);
    return false;
  }
}
