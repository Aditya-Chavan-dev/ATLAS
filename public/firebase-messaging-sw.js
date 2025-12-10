// Firebase Messaging Service Worker
// This handles push notifications when the app is in the background or closed

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase config is loaded from the main app's config
// These are client-side identifiers (not secrets) that are safe to expose
// They are protected by Firebase Security Rules and domain restrictions
// See: https://firebase.google.com/docs/projects/api-keys

// The config is injected at build time from environment variables
// For local development, create a public/config/firebase-sw-config.js file
// with the firebase config (this file is gitignored)

// Try to load config from injected script, fallback to fetching
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Service worker activated');
    event.waitUntil(clients.claim());
});

// Initialize Firebase when a push is received
// Config will be provided by the main app through messaging
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
            console.log('[SW] Firebase initialized from config file');
        }
    } catch (error) {
        console.log('[SW] Could not fetch config, using default initialization');
        // Fallback: No hardcoded config for security.
        // Ensure public/config/firebase-config.json is generated during build.
    }
};

// Handle push events
self.addEventListener('push', async (event) => {
    console.log('[SW] Push event received');

    await initializeFirebaseMessaging();

    const data = event.data?.json() || {};
    const notification = data.notification || {};

    const title = notification.title || 'ATLAS Notification';
    const options = {
        body: notification.body || 'You have a new notification',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: data.data?.tag || 'atlas-notification',
        data: data.data || {},
        vibrate: [200, 100, 200],
        actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    for (const client of clientList) {
                        if (client.url.includes(self.location.origin) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    if (clients.openWindow) {
                        return clients.openWindow('/dashboard');
                    }
                })
        );
    }
});

// Firebase messaging background handler (backup)
if (typeof firebase !== 'undefined' && firebase.messaging) {
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Background message via Firebase:', payload);
        // Already handled by push event
    });
}
