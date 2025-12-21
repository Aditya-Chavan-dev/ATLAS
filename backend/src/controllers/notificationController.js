const { db } = require('../config/firebase'); // RTDB Instance
const { getMessaging } = require('firebase-admin/messaging');

const messaging = getMessaging();

/**
 * STRICT BROADCAST IMPLEMENTATION (Consolidated to 'users' node)
 * Spec Section 7.3
 */
exports.broadcastAttendance = async (req, res) => {
    // 0. Security Barrier (Middleware should usually handle this, but we enforce here for safety)
    const { requesterUid } = req.body;

    const broadcastId = db.ref('audit/broadcasts').push().key; // Generate ID upfront
    const timestamp = Date.now();

    console.log(`[BROADCAST] Start: ${broadcastId} by ${requesterUid}`);

    try {
        // 1. Validate Requester (MD Check)
        // Standardize on 'users' node
        const requesterSnap = await db.ref(`users/${requesterUid}`).once('value');
        const requester = requesterSnap.val();

        if (requester) console.log(`[BROADCAST] Found User in users. Role: '${requester.role}'`);

        const role = requester?.role?.toLowerCase() || '';

        // Strict Role Check: MD or Owner
        if (!requester || (role !== 'md' && role !== 'owner')) {
            console.warn(`[BROADCAST] Security Violation: User ${requesterUid} (Role: ${requester?.role}) attempted broadcast.`);
            return res.status(403).json({ error: 'Unauthorized: MD Role Required' });
        }

        // 2. Fetch Audience (Active Employees Only)
        // Switch to query 'users' to match Dashboard logic
        const usersSnap = await db.ref('users').once('value');
        const users = usersSnap.val() || {};

        let eligibleTokens = [];
        const tokenOwnerMap = {}; // Map token -> { uid, tokenKey } for pruning

        Object.entries(users).forEach(([uid, user]) => {
            // Strict Eligibility Check

            // Exclude Privileged Roles
            const uRole = (user.role || '').toLowerCase();
            if (uRole === 'md' || uRole === 'owner' || uRole === 'admin') return;

            // Exclude Inactive
            if (user.isActive === false || user.status === 'archived') return;

            // Check for tokens
            if (user.fcmTokens) {
                Object.entries(user.fcmTokens).forEach(([key, tokenData]) => {
                    const token = tokenData.token;
                    // Basic sanity check
                    if (typeof token === 'string' && token.length > 20) {
                        eligibleTokens.push(token);
                        tokenOwnerMap[token] = { uid, key };
                    }
                });
            }
        });

        // Deduplicate
        eligibleTokens = [...new Set(eligibleTokens)];

        // 3. Zero-Target Handling
        if (eligibleTokens.length === 0) {
            await db.ref(`audit/broadcasts/${broadcastId}`).set({
                broadcastId,
                type: 'attendance_reminder',
                initiatedBy: requesterUid,
                initiatedAt: timestamp,
                status: 'ABORTED_NO_AUDIENCE',
                metrics: { totalTarget: 0 }
            });
            return res.json({ success: true, sent: 0, message: 'No eligible active employees with tokens found.' });
        }

        // 4. Construct Immutable Message
        // Spec Section 2.2: Fixed Content
        const messagePayload = {
            notification: {
                title: 'Attendance Reminder',
                body: 'Please mark your attendance for today'
            },
            data: {
                // Critical for deep linking
                action: 'MARK_ATTENDANCE',
                broadcastId: broadcastId,
                timestamp: String(timestamp)
            },
            tokens: eligibleTokens
        };

        // 5. Execution (Batching handled by SDK sendEachForMulticast)
        const response = await messaging.sendEachForMulticast(messagePayload);

        // 6. Outcome Analysis & Token Hygiene (Self-Healing)
        let pruned = 0;
        const prunePromises = [];

        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const errorCode = resp.error.code;
                const badToken = eligibleTokens[idx];
                const owner = tokenOwnerMap[badToken];

                if (errorCode === 'messaging/invalid-registration-token' ||
                    errorCode === 'messaging/registration-token-not-registered') {
                    if (owner) {
                        // Immediate Prune
                        prunePromises.push(
                            db.ref(`users/${owner.uid}/fcmTokens/${owner.key}`).remove()
                        );
                        pruned++;
                    }
                }
            }
        });

        await Promise.all(prunePromises);

        // 7. Authoritative Audit Record
        const auditRecord = {
            broadcastId,
            type: 'attendance_reminder',
            initiatedBy: requesterUid,
            initiatedByName: requester.name || 'Unknown MD',
            initiatedAt: timestamp,
            status: response.failureCount > 0 ? 'PARTIAL' : 'COMPLETED',
            message: {
                title: 'Attendance Reminder',
                body: 'Please mark your attendance for today'
            },
            metrics: {
                targetDeviceCount: eligibleTokens.length,
                successCount: response.successCount,
                failureCount: response.failureCount,
                prunedCount: pruned
            },
            completedAt: Date.now()
        };

        await db.ref(`audit/broadcasts/${broadcastId}`).set(auditRecord);

        console.log(`[BROADCAST] Done. Success: ${response.successCount}, Fail: ${response.failureCount}, Pruned: ${pruned}`);

        // 8. Reply to Client
        res.json({
            success: true,
            broadcastId,
            sent: response.successCount,
            failures: response.failureCount,
            pruned: pruned
        });

    } catch (error) {
        console.error('[BROADCAST] Critical Failure:', error);

        // Log failure outcome
        await db.ref(`audit/broadcasts/${broadcastId}`).update({
            status: 'CRITICAL_FAILURE',
            error: error.message,
            failedAt: Date.now()
        });

        res.status(500).json({ error: 'Broadcast System Failure', details: error.message });
    }
};

/**
 * TOKEN REGISTRATION APIs
 * Spec Section 7.2
 */
const crypto = require('crypto');
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

exports.registerToken = async (req, res) => {
    const { uid, token } = req.body;
    if (!uid || !token) return res.status(400).json({ error: 'Missing Data' });

    try {
        const hash = hashToken(token);
        // Store under users/{uid}/fcmTokens/{hash} to match Dashboard data source
        await db.ref(`users/${uid}/fcmTokens/${hash}`).set({
            token,
            lastSeen: Date.now(),
            userAgent: req.headers['user-agent'] || 'unknown'
        });

        res.json({ success: true });
    } catch (e) {
        console.error('[FCM] Register Fail:', e);
        res.status(500).json({ error: 'Storage Error' });
    }
};

exports.unregisterToken = async (req, res) => {
    const { uid, token } = req.body;
    if (!uid || !token) return res.status(400).json({ error: 'Missing Data' });

    try {
        const hash = hashToken(token);
        await db.ref(`users/${uid}/fcmTokens/${hash}`).remove();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Storage Error' });
    }
};
