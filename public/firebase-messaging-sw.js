// Firebase Messaging Service Worker
// Spec Section 9.3: Background handler registered

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Events
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

let messaging;

const initFirebase = async () => {
    if (messaging) return messaging;
    try {
        const response = await fetch('/config/firebase-config.json');
        if (response.ok) {
            const config = await response.json();
            firebase.initializeApp(config);
            messaging = firebase.messaging();

            messaging.onBackgroundMessage((payload) => {
                console.log('[SW] Background Message:', payload);
            });
        } else {
            console.error('[SW] Config fetch failed:', response.status);
        }
    } catch (e) {
        console.error('[SW] Init failed', e);
    }
};

self.addEventListener('push', (event) => {
    event.waitUntil(initFirebase());
});

// Spec 8.2: On tap -> App opens -> Redirects
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Deep Linking based on 'action' in data payload
    // Spec 6.2 Data Model implies payload has data.action
    const action = event.notification.data?.action;
    let targetUrl = '/dashboard';

    if (action === 'MARK_ATTENDANCE') {
        targetUrl = '/dashboard?action=mark';
    }

    const fullUrl = new URL(targetUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // 1. Try to focus existing tab
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus().then(c => c.navigate(fullUrl));
                }
            }
            // 2. Open new window
            if (clients.openWindow) {
                return clients.openWindow(fullUrl);
            }
        })
    );
});
