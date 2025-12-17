const { db } = require('../config/firebase'); // Keep existing DB config
const { getMessaging } = require('firebase-admin/messaging');
const crypto = require('crypto');

// ------------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------------

// Create a deterministic hash of the token (prevent unlimited duplicates)
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const messaging = getMessaging();

// ------------------------------------------------------------------
// ENDPOINTS
// ------------------------------------------------------------------

/**
 * registerToken
 * POST /api/fcm/register
 * Body: { token, uid }
 * 
 * Logic:
 * 1. Hashes the incoming token.
 * 2. Stores it under employees/{uid}/fcmTokens/{hash}.
 * 3. Sets timestamp (used for pruning).
 */
exports.registerToken = async (req, res) => {
    const { token, uid } = req.body;
    if (!token || !uid) return res.status(400).json({ error: 'Token and UID required' });

    try {
        const tokenHash = hashToken(token);
        const tokenRef = db.ref(`employees/${uid}/fcmTokens/${tokenHash}`);

        await tokenRef.set({
            token: token,
            lastSeen: Date.now(),
            deviceInfo: req.headers['user-agent'] || 'unknown' // Optional, minimal metadata
        });

        console.log(`[FCM] Registered token for ${uid} (Hash: ${tokenHash.substring(0, 8)}...)`);
        res.json({ success: true, message: 'Token registered' });
    } catch (error) {
        console.error('[FCM] Register Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * unregisterToken
 * POST /api/fcm/unregister
 * Body: { token, uid }
 * 
 * Logic:
 * 1. Hashes token.
 * 2. Removes that specific hash from DB.
 */
exports.unregisterToken = async (req, res) => {
    const { token, uid } = req.body;
    if (!token || !uid) return res.status(400).json({ error: 'Token and UID required' });

    try {
        const tokenHash = hashToken(token);
        await db.ref(`employees/${uid}/fcmTokens/${tokenHash}`).remove();

        console.log(`[FCM] Unregistered token for ${uid}`);
        res.json({ success: true, message: 'Token unregistered' });
    } catch (error) {
        console.error('[FCM] Unregister Error:', error);
        // Don't fail hard on logout, just log it
        res.json({ success: false, message: 'Logged out but token cleanup failed' });
    }
};

/**
 * broadcastAttendance
 * POST /api/fcm/broadcast
 * Body: { requesterUid } (In prod, verify ID token middleware)
 * 
 * Logic:
 * 1. Fetches ALL employees.
 * 2. Collects tokens seen in last 7 days.
 * 3. Sends multicast message.
 * 4. PRUNES invalid tokens on the fly.
 */
exports.broadcastAttendance = async (req, res) => {
    const { requesterUid } = req.body;
    // TODO: Verify requesterUid is actually an MD/Admin via Auth Middleware in real production

    console.log('[FCM] Starting Broadcast...');
    try {
        // 1. Fetch all employees
        const snapshot = await db.ref('employees').once('value');
        const employees = snapshot.val();
        if (!employees) return res.json({ success: true, count: 0, message: 'No employees found' });

        const validTokens = [];
        const tokenOwners = {}; // Map token -> { uid, hash } for pruning

        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        // 2. Filter & Collect Tokens
        Object.entries(employees).forEach(([uid, empData]) => {
            const tokensMap = empData.fcmTokens || {};

            Object.entries(tokensMap).forEach(([hash, tData]) => {
                if (!tData.token) return;

                // Prune old tokens (Lazy TTL)
                if (now - tData.lastSeen > SEVEN_DAYS_MS) {
                    // Async prune (fire & forget)
                    db.ref(`employees/${uid}/fcmTokens/${hash}`).remove();
                    return;
                }

                validTokens.push(tData.token);
                tokenOwners[tData.token] = { uid, hash };
            });
        });

        if (validTokens.length === 0) {
            return res.json({ success: true, count: 0, message: 'No active devices found' });
        }

        console.log(`[FCM] Sending to ${validTokens.length} devices...`);

        // 3. Send Multicast (Chunking handled by Admin SDK automatically up to 500, but let's be safe)
        // Note: sendEachForMulticast is efficient and provides response per token
        const message = {
            notification: {
                title: 'Attendance Required',
                body: 'Please mark today\'s attendance.'
            },
            data: {
                action: 'MARK_ATTENDANCE',
                timestamp: String(now)
            },
            tokens: validTokens
        };

        const response = await messaging.sendEachForMulticast(message);

        // 4. Handle Failures & Prune
        let prunedCount = 0;
        const potentialPrunes = [];

        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const errorCode = resp.error.code;
                if (errorCode === 'messaging/registration-token-not-registered' ||
                    errorCode === 'messaging/invalid-registration-token') {

                    const badToken = validTokens[idx];
                    const owner = tokenOwners[badToken];
                    if (owner) {
                        potentialPrunes.push(
                            db.ref(`employees/${owner.uid}/fcmTokens/${owner.hash}`).remove()
                        );
                        prunedCount++;
                    }
                }
            }
        });

        await Promise.all(potentialPrunes);
        console.log(`[FCM] Broadcast Complete. Sent: ${response.successCount}, Failed: ${response.failureCount}, Pruned: ${prunedCount}`);

        res.json({
            success: true,
            sent: response.successCount,
            pruned: prunedCount,
            failures: response.failureCount
        });

    } catch (error) {
        console.error('[FCM] Broadcast Error:', error);
        res.status(500).json({ error: 'Broadcast failed' });
    }
};

