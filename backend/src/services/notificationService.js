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
