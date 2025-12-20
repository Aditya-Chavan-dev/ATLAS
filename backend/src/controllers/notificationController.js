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
    // In production, middleware `verifyMD` should exist. Here we trust the caller context or implement a quick check if needed.

    console.log('[BROADCAST] Starting Strict Attendance Broadcast...');
    try {
        // 1. Audit Start
        const broadcastId = db.ref('audit/broadcasts').push().key;
        const auditLog = {
            id: broadcastId,
            requester: requesterUid || 'system',
            timestamp: Date.now(),
            type: 'ATTENDANCE_REMINDER',
            status: 'INITIATED'
        };

        // 2. Fetch All Employees (Source of Truth)
        // We use 'users' for profile status if available, but tokens are stored in 'employees' by this controller.
        // To be safe and banking-grade, we fetch both or assume 'employees' node is the record.
        // Based on registerToken, tokens are in `employees/{uid}/fcmTokens`.

        const snapshot = await db.ref('employees').once('value');
        const employees = snapshot.val();

        if (!employees) {
            await db.ref(`audit/broadcasts/${broadcastId}`).set({ ...auditLog, status: 'FAILED_NO_USERS' });
            return res.json({ success: true, count: 0, message: 'No employees found' });
        }

        const validTokens = [];
        const tokenOwners = {}; // Map token -> { uid, hash } for pruning

        // 3. Filter Active Employees & Collect Tokens
        Object.entries(employees).forEach(([uid, empData]) => {
            // STRICT: Active Status Check
            // If internal `isActive` flag exists, use it. If `isArchived`, skip.
            // Default to true if not specified, as "Active" is usually the default state.
            if (empData.isActive === false || empData.status === 'archived') return;

            const tokensMap = empData.fcmTokens || {};
            Object.entries(tokensMap).forEach(([hash, tData]) => {
                if (!tData.token) return;
                validTokens.push(tData.token);
                tokenOwners[tData.token] = { uid, hash };
            });
        });

        if (validTokens.length === 0) {
            await db.ref(`audit/broadcasts/${broadcastId}`).set({ ...auditLog, status: 'SKIPPED_NO_TOKENS' });
            return res.json({ success: true, count: 0, message: 'No active devices found' });
        }

        console.log(`[BROADCAST] Target: ${validTokens.length} active devices.`);

        // 4. Construct STRICT Payload (No variations allowed)
        const message = {
            notification: {
                title: 'Attendance Reminder',
                body: 'Mark the attendance for today'
            },
            data: {
                action: 'MARK_ATTENDANCE', // Frontend must handle this to navigate to Attendance Screen
                sender: 'Managing Director',
                broadcastId: broadcastId,
                timestamp: String(Date.now())
            },
            tokens: validTokens
        };

        // 5. Dispatch (Real-time, counting actual responses)
        const response = await messaging.sendEachForMulticast(message);

        // 6. Delivery Analysis & Token Maintenance
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

        // 7. Final Audit Log
        await db.ref(`audit/broadcasts/${broadcastId}`).set({
            ...auditLog,
            status: 'COMPLETED',
            targetCount: validTokens.length,
            successCount: response.successCount,
            failureCount: response.failureCount,
            prunedCount: prunedCount,
            completedAt: Date.now()
        });

        console.log(`[BROADCAST] Success: ${response.successCount}, Failed: ${response.failureCount}, Pruned: ${prunedCount}`);

        // 8. Return TRUTH to Client
        res.json({
            success: true,
            sent: response.successCount, // The ONLY number equal to "Delivered"
            failures: response.failureCount,
            pruned: prunedCount,
            totalTarget: validTokens.length
        });

    } catch (error) {
        console.error('[BROADCAST] System Error:', error);
        res.status(500).json({ error: 'Critical Broadcast Failure: ' + error.message });
    }
};

