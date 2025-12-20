// Client-Side FCM Service (Simplified & Robust)
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from "../firebase/config";
import ApiService from "./api";

const messaging = getMessaging(app);
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async (uid) => {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return null;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (token) {
                // Register with backend
                await ApiService.post('/api/fcm/register', { token, uid });
                console.log('FCM Token Registered:', token.substring(0, 10) + '...');
                return token;
            }
        } else {
            console.warn('Notification permission denied');
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
    return null;
};

// Foreground Listener
export const setupForegroundListener = (callback) => {
    return onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground Message:', payload);

        // Manual implementation of notification for foreground
        if (Notification.permission === 'granted' && payload.notification) {
            const { title, body } = payload.notification;
            // Use ServiceWorker registration to show notification if possible, 
            // or fallback to new Notification() API
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, {
                        ...payload.notification,
                        data: payload.data
                    });
                });
            } else {
                new Notification(title, {
                    body: body,
                    icon: '/pwa-192x192.png'
                });
            }
        }

        if (callback) callback(payload);
    });
};
