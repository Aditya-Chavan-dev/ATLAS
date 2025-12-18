const { messaging } = require('../config/firebase');

const sendPushNotification = async (tokens, title, body, data = {}) => {
    if (!tokens || tokens.length === 0) {
        return { successCount: 0, failureCount: 0 };
    }

    const validTokens = tokens.filter(t => t && typeof t === 'string' && t.length > 0);

    if (validTokens.length === 0) {
        console.warn('⚠️ No valid FCM tokens found.');
        return { successCount: 0, failureCount: 0 };
    }

    const message = {
        notification: {
            title,
            body
        },
        android: {
            priority: 'high',
            notification: {
                channelId: 'attendance-reminders',
                priority: 'high',
                visibility: 'public',
                defaultSound: true,
                defaultVibrateTimings: true
            }
        },
        webpush: {
            notification: {
                requireInteraction: true,
                tag: 'attendance-reminder'
            }
        },
        data: {
            ...data,
            action: data.action || 'MARK_ATTENDANCE',
            timestamp: new Date().toISOString(),
            click_action: 'https://atlas-011.web.app/dashboard'
        },
        tokens: validTokens
    };

    try {
        const response = await messaging.sendMulticast(message);
        console.log(`📤 Push sent: ${response.successCount} success, ${response.failureCount} failed`);

        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`❌ Token ${idx}: ${resp.error?.code} - ${resp.error?.message}`);
                }
            });
        }

        return {
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    } catch (error) {
        console.error('❌ Error sending push notifications:', error);
        return { successCount: 0, failureCount: validTokens.length };
    }
};

const sendTopicNotification = async (topic, title, body, data = {}) => {
    if (!topic) {
        console.error('❌ Topic is required for broadcast');
        return { success: false, error: 'Topic required' };
    }

    const message = {
        notification: {
            title,
            body
        },
        android: {
            priority: 'high',
            notification: {
                channelId: 'attendance-reminders',
                priority: 'high',
                visibility: 'public',
                defaultSound: true,
                defaultVibrateTimings: true,
                clickAction: 'MARK_ATTENDANCE'
            }
        },
        webpush: {
            headers: {
                Urgency: 'high'
            },
            notification: {
                requireInteraction: true,
                icon: 'https://atlas-011.web.app/logo.png',
                badge: 'https://atlas-011.web.app/logo.png',
                tag: 'attendance-reminder',
                renotify: true,
                actions: [
                    { action: 'mark', title: 'Mark Attendance' },
                    { action: 'dismiss', title: 'Dismiss' }
                ]
            }
        },
        data: {
            ...data,
            action: data.action || 'MARK_ATTENDANCE',
            timestamp: new Date().toISOString(),
            click_action: 'https://atlas-011.web.app/dashboard'
        },
        topic: topic
    };

    try {
        const response = await messaging.send(message);
        console.log(`📡 Topic Broadcast [${topic}] sent:`, response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error(`❌ Error sending to topic ${topic}:`, error);
        return { success: false, error: error.message };
    }
};

const subscribeToTopic = async (tokens, topic) => {
    if (!tokens || tokens.length === 0 || !topic) return;
    try {
        const response = await messaging.subscribeToTopic(tokens, topic);
        console.log(`✅ Subscribed ${response.successCount} tokens to ${topic}`);
        return response;
    } catch (error) {
        console.error(`❌ Error subscribing to ${topic}:`, error);
        throw error;
    }
};

const unsubscribeFromTopic = async (tokens, topic) => {
    if (!tokens || tokens.length === 0 || !topic) return;
    try {
        const response = await messaging.unsubscribeFromTopic(tokens, topic);
        console.log(`👋 Unsubscribed ${response.successCount} tokens from ${topic}`);
        return response;
    } catch (error) {
        console.error(`❌ Error unsubscribing from ${topic}:`, error);
        throw error;
    }
};

module.exports = { sendPushNotification, sendTopicNotification, subscribeToTopic, unsubscribeFromTopic };

