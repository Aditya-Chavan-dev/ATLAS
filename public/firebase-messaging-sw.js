// Firebase Messaging Service Worker
// STRICT MODE: Data-Only Payloads ONLY.

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

            // Background Message Handler
            messaging.onBackgroundMessage((payload) => {
                console.log('[SW] Background Message Received:', payload);

                // STRICT: We expect Data-Only payloads.
                // { "type": "ATTENDANCE_REMINDER", "route": "...", "date": "..." }

                const data = payload.data || {};

                // FIXED CONTENT (Step 4)
                const title = "Attendance Reminder";
                const body = "Mark your attendance for today";

                self.registration.showNotification(title, {
                    body: body,
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    data: data, // Persist data for click
                    tag: 'attendance-reminder', // Replace existing
                    renotify: true
                });
            });
        }
    } catch (e) {
        console.error('[SW] Init failed', e);
    }
};

self.addEventListener('push', (event) => {
    event.waitUntil(initFirebase());
});

// Click Handler (Step 6)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Navigation Logic
    // "User is navigated directly to the Mark Attendance screen"
    const targetUrl = '/dashboard?action=mark'; // Assuming this triggers the modal or view
    const fullUrl = new URL(targetUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // 1. Focus existing key tab
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus().then(c => c.navigate(fullUrl));
                }
            }
            // 2. Open new
            if (clients.openWindow) {
                return clients.openWindow(fullUrl);
            }
        })
    );
});
