const { messaging } = require('../config/firebase');

const sendPushNotification = async (tokens, title, body, data = {}) => {
    if (!tokens || tokens.length === 0) {
        return { successCount: 0, failureCount: 0 };
    }

    const validTokens = tokens.filter(t => t && typeof t === 'string' && t.length > 0);

    if (validTokens.length === 0) {
        return { successCount: 0, failureCount: 0 };
    }

    const message = {
        notification: {
            title,
            body
        },
        data: {
            ...data,
            timestamp: new Date().toISOString(),
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        // Android specific settings for banner notification
        android: {
            priority: 'high',
            notification: {
                title,
                body,
                priority: 'high',
                defaultSound: true,
                defaultVibrateTimings: true,
                visibility: 'public', // Show on lock screen
                notificationCount: 1
            }
        },
        // Web push specific settings for banner notification
        webpush: {
            notification: {
                title,
                body,
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                requireInteraction: true, // Keep notification visible
                tag: 'attendance-reminder',
                renotify: true,
                vibrate: [200, 100, 200],
                actions: [
                    {
                        action: 'mark',
                        title: 'Mark Attendance'
                    },
                    {
                        action: 'dismiss',
                        title: 'Dismiss'
                    }
                ]
            },
            fcmOptions: {
                link: 'https://atlas-011.web.app/dashboard'
            }
        },
        tokens: validTokens
    };

    try {
        const response = await messaging.sendEachForMulticast(message);
        console.log(`📤 Push sent: ${response.successCount} success, ${response.failureCount} failed`);

        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.log(`  ❌ Token ${idx}: ${resp.error?.code} - ${resp.error?.message}`);
                }
            });
        }

        return {
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    } catch (error) {
        console.error('❌ Error sending push notification:', error);
        return { successCount: 0, failureCount: tokens.length, error: error.message };
    }
};

module.exports = { sendPushNotification };

