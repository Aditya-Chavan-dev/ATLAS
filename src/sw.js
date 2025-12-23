import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// ============================================================================
// ATLAS UNIFIED SERVICE WORKER
// Handles: PWA Caching (Workbox) + Firebase Cloud Messaging (FCM)
// ============================================================================

// 1. PWA CACHING (WORKBOX)
// ============================================================================
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
self.skipWaiting();
clientsClaim();

console.log('[ATLAS SW] PWA caching initialized');

// 2. FIREBASE CLOUD MESSAGING (FCM)
// ============================================================================
// CRITICAL: Use Firebase SDK v10.7.1 (matches frontend version)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase Configuration
// IMPORTANT: These placeholders are replaced at build time by scripts/generate-sw-config.cjs
// DO NOT hardcode credentials - they are injected during build
const firebaseConfig = {
    apiKey: "AIzaSyAeDXg4T16u3lCNDxHfyA7n3WQCrPp4MAA",
    authDomain: "atlas-011.firebaseapp.com",
    databaseURL: "https://atlas-011-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "atlas-011",
    storageBucket: "atlas-011.firebasestorage.app",
    messagingSenderId: "770708381517",
    appId: "1:770708381517:web:84faf71d62f741494f6104"
};

// Initialize Firebase (synchronous, deterministic)
try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    console.log('[ATLAS SW] Firebase Messaging initialized');

    // ✅ CRITICAL: Use onBackgroundMessage (Firebase's official API)
    // This is the CORRECT way to handle FCM push events
    messaging.onBackgroundMessage((payload) => {
        console.log('[ATLAS SW] Background message received:', payload);

        // Extract data from data-only payload
        const { type, route, date } = payload.data || {};

        // Hardcoded notification content (as per spec)
        const notificationTitle = "Attendance Reminder";
        const notificationOptions = {
            body: "Mark your attendance for today",
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'attendance-reminder',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: {
                type,
                route,
                date,
                url: '/',
                action: route // For click handler
            }
        };

        // Show notification
        return self.registration.showNotification(notificationTitle, notificationOptions);
    });

} catch (error) {
    console.error('[ATLAS SW] Firebase initialization failed:', error);
    // Continue - PWA features will still work
}

// 3. NOTIFICATION CLICK HANDLER
// ============================================================================
self.addEventListener('notificationclick', (event) => {
    console.log('[ATLAS SW] Notification clicked:', event.notification.data);

    event.notification.close();

    // Determine target URL based on action
    const action = event.notification.data?.action;
    let targetUrl = '/';

    if (action === 'MARK_ATTENDANCE') {
        targetUrl = '/dashboard';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        // Focus existing window and navigate
                        client.focus();
                        return client.navigate(targetUrl);
                    }
                }
                // Open new window if app is not open
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

// 4. RUNTIME LOGGING
// ============================================================================
self.addEventListener('activate', (event) => {
    console.log('[ATLAS SW] Service Worker activated');
});

self.addEventListener('install', (event) => {
    console.log('[ATLAS SW] Service Worker installed');
});
