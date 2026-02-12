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
/**
 * Notify Admins (MD, Owner, Admin)
 * Uses Optimized "Laser Query"
 */
exports.notifyAdmins = async (title, body, data = {}) => {
    try {
        const { db } = require('../config/firebase');
        const targetRoles = ['MD', 'owner', 'admin'];
        const adminUids = new Set();

        // Parallel Query
        await Promise.all(targetRoles.map(async (role) => {
            const snap = await db.ref('employees')
                .orderByChild('profile/role')
                .equalTo(role)
                .once('value');
            Object.keys(snap.val() || {}).forEach(id => adminUids.add(id));
        }));

        if (adminUids.size === 0) return;

        // Fetch Tokens
        const tokenSnaps = await Promise.all(
            [...adminUids].map(uid => db.ref(`fcm_tokens/${uid}`).once('value'))
        );

        const tokens = tokenSnaps
            .flatMap(snap => Object.values(snap.val() || {}))
            .filter(t => t && t.token && t.permission === 'granted')
            .map(t => t.token);

        const uniqueTokens = [...new Set(tokens)];

        if (uniqueTokens.length > 0) {
            await exports.sendPushNotification(uniqueTokens, title, body, data);
        }
    } catch (error) {
        console.warn('[NotifyAdmins] Failed (non-fatal):', error);
    }
};
