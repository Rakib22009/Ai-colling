self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'LinguaConnect AI', body: event.data.text() };
  }
  const title = payload.title || 'LinguaConnect AI';
  const options = {
    body: payload.body || 'New activity on LinguaConnect AI',
    icon: payload.icon || '/src/assets/images/linguaconnect_emblem_1795114125651.jpg',
    badge: '/src/assets/images/linguaconnect_emblem_1795114125651.jpg',
    tag: payload.tag || 'linguaconnect-alert',
    requireInteraction: payload.type === 'call_incoming',
    data: payload.data || {},
    actions: payload.type === 'call_incoming'
      ? [
          { action: 'accept', title: 'Accept Call' },
          { action: 'reject', title: 'Decline' },
        ]
      : [{ action: 'open', title: 'Open' }],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action || 'open';
  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'LINGUA_NOTIFICATION_ACTION',
            action,
            data,
          });
          return;
        }
      }
      if (self.clients.openWindow) {
        const suffix = action === 'accept' || action === 'reject' ? `?notifAction=${action}` : '';
        return self.clients.openWindow(`${targetUrl}${suffix}`);
      }
      return undefined;
    })
  );
});
