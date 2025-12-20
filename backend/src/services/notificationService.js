const { getMessaging } = require('firebase-admin/messaging');

const messaging = getMessaging();

exports.sendPushNotification = async (tokens, title, body, data = {}) => {
    if (!tokens || tokens.length === 0) return;

    // Filter valid tokens string
    const validTokens = tokens.filter(t => typeof t === 'string' && t.length > 20);
    if (validTokens.length === 0) return;

    const message = {
        notification: { title, body },
        data: { ...data, timestamp: String(Date.now()) },
        tokens: validTokens
    };

    try {
        const response = await messaging.sendEachForMulticast(message);
        console.log(`[Push] Sent: ${response.successCount}, Failed: ${response.failureCount}`);

        // Optional: Pruning logic here if desired, but kept simple for now to fix the crash
        return response;
    } catch (error) {
        console.error('[Push] Error:', error);
    }
};
