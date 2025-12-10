// Firebase Cloud Messaging (FCM) Service
// Handles push notification permissions, token management, and foreground messages

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { ref, update } from "firebase/database";
import app, { database } from "../firebase/config";

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
        if (!("Notification" in window)) {
            console.log("This browser does not support notifications");
            return null;
        }

        // Request permission
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            console.log("Notification permission granted");

            // Get FCM token
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });

            if (token) {
                console.log("FCM Token obtained:", token.substring(0, 20) + "...");

                // Save token to database
                await saveTokenToDatabase(uid, token);

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
 * Save FCM token to Firebase Realtime Database
 * @param {string} uid - User's Firebase UID
 * @param {string} token - FCM token
 */
const saveTokenToDatabase = async (uid, token) => {
    if (!uid || !token) return;

    try {
        const userRef = ref(database, `users/${uid}`);
        await update(userRef, {
            fcmToken: token,
            lastTokenUpdate: new Date().toISOString(),
            notificationsEnabled: true
        });
        console.log("FCM token saved to database");
    } catch (error) {
        console.error("Error saving FCM token:", error);
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

/**
 * Remove FCM token from database (e.g., on logout)
 * @param {string} uid - User's Firebase UID
 */
export const removeNotificationToken = async (uid) => {
    if (!uid) return;

    try {
        const userRef = ref(database, `users/${uid}`);
        await update(userRef, {
            fcmToken: null,
            notificationsEnabled: false
        });
        console.log("FCM token removed from database");
    } catch (error) {
        console.error("Error removing FCM token:", error);
    }
};
