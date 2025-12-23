// Firebase Cloud Messaging Service Worker
// Handles background notifications (data-only payloads)

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase Configuration
// IMPORTANT: This configuration is injected at build time by scripts/generate-sw-config.cjs
// DO NOT hardcode credentials here - they are replaced during the build process
// The build script reads from environment variables and injects the config below
const firebaseConfig = {
    apiKey: "__FIREBASE_API_KEY__",
    authDomain: "__FIREBASE_AUTH_DOMAIN__",
    databaseURL: "__FIREBASE_DATABASE_URL__",
    projectId: "__FIREBASE_PROJECT_ID__",
    storageBucket: "__FIREBASE_STORAGE_BUCKET__",
    messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
    appId: "__FIREBASE_APP_ID__"
};

// Initialize Firebase in Service Worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
    console.log('[Service Worker] Background Message Received:', payload);

    // Extract data from payload
    const { type, route, date } = payload.data || {};

    // Hardcoded notification content (as per your spec)
    const notificationTitle = "Attendance Reminder";
    const notificationOptions = {
        body: "Mark your attendance for today",
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'attendance-reminder',
        requireInteraction: true,
        data: {
            type,
            route,
            date,
            url: '/' // Navigate to home page on click
        }
    };

    // Show notification
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event.notification.data);

    event.notification.close();

    // Navigate to the app
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if app is not open
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});
