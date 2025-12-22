// Firebase Cloud Messaging (FCM) Service
// Strict Implementation: Data-Only Payloads, Explicit Status Tracking

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from "../firebase/config";
import ApiService from "./api"; // Wrapper for backend calls

const messaging = getMessaging(app);
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Request Notification Permission & Sync Status
 * MUST be called after login.
 */
export const requestNotificationPermission = async (uid) => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            // 1. Get Token
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });

            if (token) {
                // 2. Send to Backend: INSTALLED + ON
                await ApiService.post('/api/fcm/register', {
                    uid,
                    token,
                    platform: 'web',
                    permission: 'granted',
                    timestamp: new Date().toISOString()
                });
                console.log('[FCM] Token Registered:', token);
            }
        } else {
            // 3. Permission Denied (Step 2.1: Do NOT create a token entry)
            // We track locally or just do nothing.
            console.log('[FCM] Permission Denied. No token registered.');
        }

    } catch (error) {
        console.error('[FCM] Permission/Token Error:', error);
    }
};

/**
 * Handle Foreground Messages
 * Displays a manual notification because we use Data-Only payloads.
 */
export const setupForegroundListener = () => {
    return onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground Message Received:', payload);

        // Data-Only Payload Handling
        // Payload comes in 'data' key (e.g. payload.data.type, payload.data.route)
        // We construct the notification manually.
        const { type, route, date } = payload.data || {};

        // HARDCODED CONTENT as per Step 4
        const title = "Attendance Reminder";
        const body = "Mark your attendance for today"; // Fixed text

        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '/pwa-192x192.png',
                data: payload.data // Pass original data for click handling if needed
            });
        }
    });
};
