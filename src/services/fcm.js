// Firebase Cloud Messaging (Strict Client Service)
// Spec Section 9: Permissions & Token Management

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from "../firebase/config";
import ApiService from "./api"; // Your Axios wrapper

// Initialize Messaging
const messaging = getMessaging(app);

// VAPID Key from environment
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async (uid) => {
    if (!('Notification' in window)) {
        return null;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });

            if (token) {
                // Register with Backend
                await ApiService.post('/api/fcm/register', { uid, token });
                return token;
            }
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
    return null;
};

export const removeNotificationToken = async (uid) => {
    try {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY }).catch(() => null);
        if (token && uid) {
            await ApiService.post('/api/fcm/unregister', { uid, token });
        }
    } catch (err) {
        console.error('Unregister failed', err);
    }
};

export const setupForegroundListener = () => {
    return onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground:', payload);

        const { title, body } = payload.notification || {};
        if (title && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '/pwa-192x192.png',
                data: payload.data
            });
        }
    });
};
