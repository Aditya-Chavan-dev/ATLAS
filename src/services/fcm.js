// Firebase Cloud Messaging (FCM) Service
// Handles push notification permissions, token management, and foreground messages

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import app from "../firebase/config";
import ApiService from "./api";

// Initialize Firebase Messaging
const messaging = getMessaging(app);

// VAPID Key from Firebase Console -> Project Settings -> Cloud Messaging -> Web configuration
// This key is used to authenticate with FCM servers
// SECURITY: Stored in environment variable - add VITE_FIREBASE_VAPID_KEY to your .env file
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Request notification permission and get FCM token
 * @param {string} uid - User's Firebase UID
 * @returns {Promise<string|null>} - FCM token or null if permission denied
 */
export const requestNotificationPermission = async (uid) => {
    try {
        // Check if notifications are supported
        if (!("Notification" in window) && !Capacitor.isNativePlatform()) {
            console.log("This browser does not support notifications");
            return null;
        }

        // Create high-importance channel for Android (required for Heads-up / Floating)
        if (Capacitor.getPlatform() === 'android') {
            try {
                await PushNotifications.createChannel({
                    id: 'attendance-reminders',
                    name: 'Attendance Reminders',
                    description: 'High priority alerts for attendance marking',
                    importance: 5, // High importance
                    visibility: 1, // Public
                    sound: 'default',
                    vibration: true
                });
                console.log("✅ Android Notification Channel created/verified");
            } catch (err) {
                console.error("Error creating Android channel:", err);
            }
        }

        // Request permission
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            console.log("Notification permission granted");

            // Get FCM token
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });

            if (token) {
                console.log("FCM Token obtained:", token.substring(0, 20) + "...");

                // Register token with backend (hashing & storage)
                await ApiService.post('/api/fcm/register', { token, uid });
                console.log("✅ Token registered with backend");

                return token;
            } else {
                console.log("No FCM token available");
            }
        } else if (permission === "denied") {
            console.log("Notification permission denied");
        } else {
            console.log("Notification permission dismissed");
        }
    } catch (error) {
        console.error("Error requesting notification permission:", error);
    }

    return null;
};

/**
 * Remove FCM token from backend (e.g., on logout)
 * @param {string} uid - User's Firebase UID
 */
export const removeNotificationToken = async (uid) => {
    if (!uid) return;

    try {
        // We need the token to unregister it specificially.
        // Try to get it from firebase messaging cache
        const token = await getToken(messaging, { vapidKey: VAPID_KEY }).catch(() => null);

        if (token) {
            await ApiService.post('/api/fcm/unregister', { token, uid });
            console.log("✅ Token unregistered from backend");
        } else {
            console.warn("Could not retrieve token for unregistration (might be already cleared)");
        }
    } catch (error) {
        console.error("Error removing FCM token:", error);
    }
};

/**
 * Listen for foreground messages
 * Returns a promise that resolves when a message is received
 * @returns {Promise<object>} - Payload of the received message
 */
export const onMessageListener = () => {
    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log("Foreground message received:", payload);
            resolve(payload);
        });
    });
};

/**
 * Set up continuous foreground message listener with callback
 * @param {function} callback - Function to call when message received
 * @returns {function} - Unsubscribe function
 */
export const setupForegroundListener = (callback) => {
    return onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
        if (callback) {
            callback(payload);
        }
    });
};
