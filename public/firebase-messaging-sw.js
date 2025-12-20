// Basic Service Worker for FCM
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Events
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Initialize Firebase (Lazy)
// Logic: If we receive a push, we try to initialize. 
// Standard FCM behavior handles display automatically for background messages.
// We only need to handle clicks.

let messaging;

const initFirebase = async () => {
    if (messaging) return messaging;
    try {
        const response = await fetch('/config/firebase-config.json');
        if (response.ok) {
            const config = await response.json();
            firebase.initializeApp(config);
            messaging = firebase.messaging();

            // Optional: Background handler for logging or modifying payload
            messaging.onBackgroundMessage((payload) => {
                console.log('[SW] Background Message:', payload);
                // We let the browser handle the display based on the 'notification' key in payload.
                // We do NOT call showNotification manually here to avoid duplicates.
            });
        }
    } catch (e) {
        console.error('[SW] Init failed', e);
    }
};

// Push Event - Ensure Init
self.addEventListener('push', (event) => {
    event.waitUntil(initFirebase());
});

// Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Logic: Focus existing tab or open new
    // Check data.action for routing
    const targetUrl = (event.notification.data && event.notification.data.action === 'MARK_ATTENDANCE')
        ? '/dashboard?action=mark'
        : '/dashboard';

    const fullUrl = new URL(targetUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if tab is open
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus().then(c => c.navigate(fullUrl));
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(fullUrl);
            }
        })
    );
});
