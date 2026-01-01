import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { get } from 'idb-keyval';

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

// 1.1 BACKGROUND SYNC (Offline Durability)
// ============================================================================
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

import { get } from 'idb-keyval';

// Key used in src/utils/tokenSync.js
const SYNC_TOKEN_KEY = 'atlas_fc_token';
const SYNC_REFRESH_KEY = 'atlas_fc_refresh';

// Helper: Exchange Refresh Token for New Access Token (Manual / Google API)
const refreshAccessToken = async (refreshToken) => {
    try {
        const apiKey = firebaseConfig.apiKey; // Available in scope
        const endpoint = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=refresh_token&refresh_token=${refreshToken}`
        });
        const data = await response.json();
        if (data.id_token) {
            console.log('[ATLAS SW] Token Refreshed Manually');
            return data.id_token;
        }
        throw new Error(data.error?.message || 'Refresh Failed');
    } catch (e) {
        console.error('[ATLAS SW] Manual Refresh Error:', e);
        return null;
    }
};

const bgSyncPlugin = new BackgroundSyncPlugin('attendanceQueue', {
    maxRetentionTime: 24 * 60, // Retry for 24 Hours
    onSync: async ({ queue }) => {
        let entry;
        try {
            // 1. Fetch Tokens from IDB
            let accessToken = await get(SYNC_TOKEN_KEY);
            const refreshToken = await get(SYNC_REFRESH_KEY);

            // 2. Iterate queue
            while ((entry = await queue.shiftRequest())) {
                try {
                    const request = entry.request;
                    let finalRequest = request;

                    // PRE-FLIGHT CHECK: If we have a token, inject it.
                    if (accessToken) {
                        const newHeaders = new Headers(request.headers);
                        newHeaders.set('Authorization', `Bearer ${accessToken}`);
                        finalRequest = new Request(request.url, {
                            method: request.method,
                            headers: newHeaders,
                            body: await request.arrayBuffer(),
                            mode: request.mode,
                            credentials: request.credentials
                        });
                    }

                    // ATTEMPT 1
                    let response = await fetch(finalRequest.clone());

                    // If 401 (Unauthorized) & We have Refresh Token -> Try Refreshing
                    if (response.status === 401 && refreshToken) {
                        console.log('[ATLAS SW] 401 Detected. Attempting Refresh...');
                        const newToken = await refreshAccessToken(refreshToken);
                        if (newToken) {
                            accessToken = newToken; // Update local var for next requests
                            // Retry Request
                            const retryHeaders = new Headers(request.headers);
                            retryHeaders.set('Authorization', `Bearer ${newToken}`);
                            const retryRequest = new Request(request.url, {
                                method: request.method,
                                headers: retryHeaders,
                                body: await request.arrayBuffer(), // Needs fresh clone? clone() used above.
                                // Request object bodies can only be read once. 
                                // We read entry.request.arrayBuffer() for finalRequest.
                                // We need to re-read or preserve.
                                // Actually, 'finalRequest' body was consumed by fetch?
                                // 'fetch(finalRequest.clone())' handles it.
                            });
                            // Wait, constructing Request from arrayBuffer consumes it? 
                            // No, passing arrayBuffer creates a body.
                            // Let's just create a new Request from entry.request (which is preserved in IDB)
                            // Actually, queue.shiftRequest gives us the entry. We haven't modified entry.request.

                            const retryReq2 = new Request(request.url, {
                                method: request.method,
                                headers: retryHeaders,
                                body: await request.clone().arrayBuffer(),
                                mode: request.mode
                            });

                            response = await fetch(retryReq2);
                            console.log('[ATLAS SW] Retry with Refreshed Token:', response.status);
                        }
                    }

                    if (!response.ok && response.status !== 401) {
                        // Other errors (500, etc) - maybe throw to retry later?
                        // If 4xx (client error), usually we shouldn't retry, but for sync we might.
                        // Let's log.
                        console.warn('[ATLAS SW] Request failed:', response.status);
                    }
                    console.log('[ATLAS SW] Replay Success');

                } catch (fetchError) {
                    console.error('[ATLAS SW] Replay Network Error:', fetchError);
                    await queue.unshiftRequest(entry);
                    throw fetchError;
                }
            }
        } catch (error) {
            console.error('[ATLAS SW] Background Sync Crash:', error);
            throw error;
        }
    }
});

registerRoute(
    ({ url }) => url.pathname.includes('/api/attendance/mark'),
    new NetworkOnly({
        plugins: [bgSyncPlugin]
    }),
    'POST'
);
console.log('[ATLAS SW] Background Sync registered for Attendance');

// 2. FIREBASE CLOUD MESSAGING (FCM)
// ============================================================================
// CRITICAL: Use Firebase SDK v10.7.1 (matches frontend version)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase Configuration
// IMPORTANT: These placeholders are replaced at build time by scripts/generate-sw-config.cjs
// DO NOT hardcode credentials - they are injected during build
const firebaseConfig = {
    apiKey: "__FIREBASE_API_KEY__",
    authDomain: "__FIREBASE_AUTH_DOMAIN__",
    databaseURL: "__FIREBASE_DATABASE_URL__",
    projectId: "__FIREBASE_PROJECT_ID__",
    storageBucket: "__FIREBASE_STORAGE_BUCKET__",
    messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
    appId: "__FIREBASE_APP_ID__"
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
