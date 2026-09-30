const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_VAPID_PUBLIC_KEY =
  'BAbqW8JmjXcbFRodpOYM4DXrR_ge2h-D2dYMBUmw5n8QUfezFjXbe738zCA4nsdoWmOezY39fo7p4NJjopc9SBA';
const DEFAULT_VAPID_PRIVATE_KEY =
  'h8_7l6uJAWTHdz509r55OKmOwTaBmbrSvagsgL5eXew';
const DEFAULT_VAPID_SUBJECT = 'mailto:support@noteonweb.com';

webpush.setVapidDetails(DEFAULT_VAPID_SUBJECT, DEFAULT_VAPID_PUBLIC_KEY, DEFAULT_VAPID_PRIVATE_KEY);

async function main() {
  const userId = 'cmuksnlog0000vr7a8w6ieq6z';
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  console.log(`Found ${subs.length} subscriptions for user:`);

  const payload = JSON.stringify({
    title: '🔔 ทดสอบส่งตรงถึงมือถือ POCO!',
    body: 'การแจ้งเตือน Web Push ทำงานได้แล้วครับ',
    url: '/dashboard',
    tag: `test-${Date.now()}`,
  });

  for (const s of subs) {
    console.log(`\n➡️ Sending to device: ${s.deviceType} (${s.id})`);
    console.log(`   UserAgent: ${s.userAgent?.slice(0, 70)}...`);
    console.log(`   Endpoint: ${s.endpoint.slice(0, 50)}...`);

    const pushSubscription = {
      endpoint: s.endpoint,
      keys: {
        p256dh: s.p256dh,
        auth: s.auth,
      },
    };

    try {
      const res = await webpush.sendNotification(pushSubscription, payload, {
        TTL: 60 * 60 * 24,
        urgency: 'high',
      });
      console.log(`   ✅ Success! Status code: ${res.statusCode} (FCM accepted message)`);
    } catch (err) {
      console.log(`   ❌ Error sending to ${s.deviceType}: status ${err.statusCode}, message: ${err.message}`);
      if (err.body) console.log('   Response body:', err.body);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
