import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// This is the unified service worker for ATLAS
// It handles BOTH PWA caching and Firebase Cloud Messaging (FCM)

// 1. PWA Caching (Workbox)
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
self.skipWaiting();
clientsClaim();

// 2. Firebase Cloud Messaging (FCM)
// We use the compat version for better service worker support
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

let messagingInitialized = false;

const initializeFirebaseMessaging = async () => {
    if (messagingInitialized) return;

    try {
        // Fetch config from the app
        const response = await fetch('/config/firebase-config.json');
        if (response.ok) {
            const config = await response.json();
            firebase.initializeApp(config);
            messagingInitialized = true;
            console.log('[Unified SW] Firebase initialized from config file');
        }
    } catch (error) {
        console.log('[Unified SW] Could not fetch config:', error);
    }
};

// Handle push events
self.addEventListener('push', async (event) => {
    console.log('[Unified SW] Push event received');
    await initializeFirebaseMessaging();

    if (firebase.messaging.isSupported()) {
        const payload = event.data?.json() || {};
        // STRICT: Data-Only Payload Handling
        const { type, route, date } = payload.data || {};

        console.log('[Unified SW] Payload:', payload);

        let title = 'ATLAS Notification';
        let body = 'You have a new message';

        // Custom Logic for Attendance Reminder
        if (type === 'ATTENDANCE_REMINDER') {
            title = "Attendance Reminder";
            body = "Mark your attendance for today";
        } else if (payload.notification) {
            // Fallback for console tests
            title = payload.notification.title;
            body = payload.notification.body;
        }

        const options = {
            body: body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'attendance-reminder',
            data: payload.data || {}, // Persist for click handler
            vibrate: [200, 100, 200],
            renotify: true
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Determine target URL based on action
    const action = event.notification.data?.action;
    let targetUrl = '/';
    if (action === 'MARK_ATTENDANCE') {
        targetUrl = '/dashboard?action=mark';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        // Focus the window
                        client.focus();
                        // Navigate it to the target URL
                        return client.navigate(targetUrl);
                    }
                }
                // If no window is open, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});
