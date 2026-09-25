// Service Worker for Note on Web (Web Push Notifications)

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Web Push Event Listener ──
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Note on Web', body: event.data.text() };
    }
  }

  const title = data.title || '🔔 Note on Web';
  const options = {
    body: data.body || 'ถึงเวลาเตือนความจำสำหรับโน้ตของคุณแล้ว',
    icon: '/NoteAll-icon.png',
    badge: '/NoteAll.ico',
    tag: data.tag || 'note-reminder',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/dashboard',
      noteId: data.noteId,
      reminderId: data.reminderId,
    },
    actions: [
      {
        action: 'open',
        title: '📖 เปิดดูโน้ต',
      },
      {
        action: 'close',
        title: 'ปิด',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click Listener ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window for Note on Web is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            if ('navigate' in client && targetUrl) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
      }
      // If no window is currently open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
