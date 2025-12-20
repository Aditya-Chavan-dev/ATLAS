const { db } = require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');
const crypto = require('crypto');

const messaging = getMessaging();

// ------------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------------

// Create a deterministic hash of the token (prevent unlimited duplicates)
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// ------------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------------

/**
 * registerToken
 * POST /api/fcm/register
 * Body: { token, uid }
 */
exports.registerToken = async (req, res) => {
    const { token, uid } = req.body;
    if (!token || !uid) return res.status(400).json({ error: 'Token and UID required' });

    try {
        const tokenHash = hashToken(token);

        // We store tokens under 'employees' to keep user profile data clean
        // Structure: employees/{uid}/fcmTokens/{hash} = { token, lastSeen, userAgent }
        const tokenRef = db.ref(`employees/${uid}/fcmTokens/${tokenHash}`);

        await tokenRef.set({
            token: token,
            lastSeen: Date.now(),
            userAgent: req.headers['user-agent'] || 'unknown'
        });

        console.log(`[FCM] Registered token for ${uid} (Hash: ${tokenHash.substring(0, 8)}...)`);
        res.json({ success: true });
    } catch (error) {
        console.error('[FCM] Register Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * unregisterToken
 * POST /api/fcm/unregister
 * Body: { token, uid }
 */
exports.unregisterToken = async (req, res) => {
    const { token, uid } = req.body;
    if (!token || !uid) return res.status(400).json({ error: 'Token and UID required' });

    try {
        const tokenHash = hashToken(token);
        await db.ref(`employees/${uid}/fcmTokens/${tokenHash}`).remove();
        console.log(`[FCM] Unregistered token for ${uid}`);
        res.json({ success: true });
    } catch (error) {
        console.error('[FCM] Unregister Error:', error);
        res.json({ success: false, message: 'Cleanup failed' });
    }
};

/**
 * broadcastAttendance
 * POST /api/fcm/broadcast
 * Body: { requesterUid }
 * 
 * "Mission Critical" Logic:
 * 1. Fetch ALL tokens from ALL employees.
 * 2. Send "Attendance Reminder" to every single one.
 * 3. Log results.
 */
exports.broadcastAttendance = async (req, res) => {
    const { requesterUid } = req.body;
    console.log('[BROADCAST] Initiating mission-critical broadcast...');

    try {
        // 1. Fetch Tokens
        const snapshot = await db.ref('employees').once('value');
        const employees = snapshot.val();

        if (!employees) return res.json({ success: true, count: 0, message: 'No employees found' });

        let allTokens = [];
        let tokenOwners = {}; // map token -> { uid, hash } for cleanup

        Object.entries(employees).forEach(([uid, data]) => {
            // Optional: Filter archived users? 
            // User said "No matter what" -> but presumably ex-employees shouldn't get it.
            // keeping basic active check if possible, or just send to all valid tokens.
            if (data.status === 'archived') return;

            if (data.fcmTokens) {
                Object.entries(data.fcmTokens).forEach(([hash, tData]) => {
                    if (tData.token) {
                        allTokens.push(tData.token);
                        tokenOwners[tData.token] = { uid, hash };
                    }
                });
            }
        });

        if (allTokens.length === 0) {
            return res.json({ success: true, count: 0, message: 'No devices registered' });
        }

        console.log(`[BROADCAST] Sending to ${allTokens.length} devices.`);

        // 2. Construct Payload (Strict)
        const message = {
            notification: {
                title: 'Attendance Reminder',
                body: 'Mark the attendance for today'
            },
            data: {
                action: 'MARK_ATTENDANCE', // For click handling
                timestamp: String(Date.now()),
                sender: 'MD'
            },
            tokens: allTokens
        };

        // 3. Send (Multicast)
        const response = await messaging.sendEachForMulticast(message);

        // 4. Cleanup Invalid Tokens (Critical for long-term health)
        let pruned = 0;
        const cleanupPromises = [];

        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const err = resp.error.code;
                if (err === 'messaging/invalid-registration-token' ||
                    err === 'messaging/registration-token-not-registered') {

                    const badToken = allTokens[idx];
                    const owner = tokenOwners[badToken];
                    if (owner) {
                        cleanupPromises.push(db.ref(`employees/${owner.uid}/fcmTokens/${owner.hash}`).remove());
                        pruned++;
                    }
                }
            }
        });

        await Promise.all(cleanupPromises);

        // 5. Audit
        const logData = {
            timestamp: Date.now(),
            requester: requesterUid || 'unknown',
            targetCount: allTokens.length,
            successCount: response.successCount,
            failureCount: response.failureCount,
            prunedCount: pruned
        };
        await db.ref('audit/broadcasts').push(logData);

        console.log(`[BROADCAST] Done. Success: ${response.successCount}, Failed: ${response.failureCount}, Pruned: ${pruned}`);

        res.json({
            success: true,
            sent: response.successCount,
            failures: response.failureCount,
            pruned: pruned
        });

    } catch (error) {
        console.error('[BROADCAST] Critical Failure:', error);
        res.status(500).json({ error: error.message });
    }
};
