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
 * CRITICAL: Binds FCM token to the active service worker registration
 */
export const requestNotificationPermission = async (uid) => {
    if (!('Notification' in window)) {
        console.warn('[FCM] This browser does not support desktop notification');
        return;
    }

    if (!('serviceWorker' in navigator)) {
        console.warn('[FCM] This browser does not support service workers');
        return;
    }

    try {
        // 1. Request Permission
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('[FCM] Permission granted, waiting for service worker...');

            // 2. Wait for Service Worker to be ready (CRITICAL)
            const registration = await navigator.serviceWorker.ready;
            console.log('[FCM] Service worker ready with scope:', registration.scope);

            // 3. Get Token with Service Worker Binding (CRITICAL)
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration  // ✅ BIND TO ACTIVE SW
            });

            if (token) {
                // 4. Send to Backend: INSTALLED + ON
                await ApiService.post('/api/fcm/register', {
                    uid,
                    token,
                    platform: 'web',
                    permission: 'granted',
                    timestamp: new Date().toISOString()
                });
                console.log('[FCM] Token Registered:', token);
                console.log('[FCM] Token bound to SW scope:', registration.scope);
            } else {
                console.error('[FCM] Failed to generate token');
            }
        } else {
            // 5. Permission Denied (Do NOT create a token entry)
            console.log('[FCM] Permission Denied. No token registered.');
        }

    } catch (error) {
        console.error('[FCM] Permission/Token Error:', error);
        console.error('[FCM] Error details:', error.code, error.message);
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

        // Dispatch Event for UI (Debugging & In-App Alerts)
        const event = new CustomEvent('FCM_MESSAGE_RECEIVED', { detail: payload });
        window.dispatchEvent(event);

        // HARDCODED CONTENT as per Step 4
        const title = payload.notification?.title || "Attendance Reminder";
        const body = payload.notification?.body || "Mark your attendance for today";

        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '/pwa-192x192.png',
                data: payload.data // Pass original data for click handling if needed
            });
        }
    });
};
