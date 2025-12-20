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
        // The background message handler will be triggered if defined, 
        // but we can also handle it here directly
        const data = event.data?.json() || {};
        const notification = data.notification || {};

        const title = notification.title || 'ATLAS Notification';
        const options = {
            body: notification.body || 'You have a new notification',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: data.data?.tag || 'atlas-notification',
            data: data.data || {},
            vibrate: [200, 100, 200]
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
