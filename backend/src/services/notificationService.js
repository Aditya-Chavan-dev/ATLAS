const { messaging } = require('../config/firebase');

// Simple Service to internalize non-HTTP notification logic if needed
// Currently empty as logic is moved to Controllers for direct handling,
// but kept for compatibility with other controllers importing it.

const sendPushNotification = async (tokens, title, body, data = {}) => {
    // Legacy support wrapper - directs to multicast
    // Simulating the behaviour for other controllers that might use it
    if (!tokens || !tokens.length) return;

    try {
        const message = {
            notification: { title, body },
            data: { ...data, timestamp: String(Date.now()) },
            tokens: tokens
        };
        const response = await messaging.sendEachForMulticast(message);
        console.log(`[SERVICE] Push sent. Success: ${response.successCount}`);
        return response;
    } catch (error) {
        console.error('[SERVICE] Push failed:', error);
        return null;
    }
};

module.exports = { sendPushNotification };
