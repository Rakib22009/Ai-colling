// Web Push & Service Worker notification bridge

let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerNotificationWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return swRegistration;
  } catch (err) {
    console.warn('Service worker registration notice:', err);
    return null;
  }
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    await registerNotificationWorker();
    return 'granted';
  }
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    await registerNotificationWorker();
  }
  return result;
}

export interface BrowserNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  type: 'call_incoming' | 'friend_request' | 'friend_accepted' | 'system';
  callId?: string;
  callType?: 'voice' | 'video';
  url?: string;
}

export async function showBrowserNotification(payload: BrowserNotificationPayload): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const icon = '/src/assets/images/linguaconnect_emblem_1795114125651.jpg';
  const options: NotificationOptions & {
    actions?: Array<{ action: string; title: string }>;
    requireInteraction?: boolean;
  } = {
    body: payload.body,
    icon,
    badge: icon,
    tag: payload.tag || `linguaconnect-${payload.type}`,
    requireInteraction: payload.type === 'call_incoming',
    data: {
      url: payload.url || '/',
      callId: payload.callId,
      callType: payload.callType,
      type: payload.type,
    },
  };

  if (payload.type === 'call_incoming') {
    options.actions = [
      { action: 'accept', title: 'Accept Call' },
      { action: 'reject', title: 'Decline' },
    ];
  }

  try {
    const reg = swRegistration || (await registerNotificationWorker());
    if (reg && 'showNotification' in reg) {
      await reg.showNotification(payload.title, options);
      return;
    }
  } catch {
    // Fallback to Notification constructor below
  }

  try {
    const notif = new Notification(payload.title, {
      body: payload.body,
      icon,
      tag: options.tag,
    });
    notif.onclick = () => {
      window.focus();
      if (payload.url) {
        window.dispatchEvent(
          new CustomEvent('lingua-navigate', { detail: { url: payload.url } })
        );
      }
      notif.close();
    };
  } catch {
    // Some embedded contexts restrict Notification constructor without SW
  }
}
