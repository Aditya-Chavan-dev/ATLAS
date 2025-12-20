const { db } = require('../config/firebase'); // RTDB Instance
const { getMessaging } = require('firebase-admin/messaging');

const messaging = getMessaging();

/**
 * STRICT BROADCAST IMPLEMENTATION
 * Spec Section 7.3
 */
exports.broadcastAttendance = async (req, res) => {
    // 0. Security Barrier (Middleware should usually handle this, but we enforce here for safety)
    const { requesterUid } = req.body;

    // In a real production env, you would extract uid from the Bearer token. 
    // For this implementation, we assume the route is protected or we verify the requester status now.

    const broadcastId = db.ref('audit/broadcasts').push().key; // Generate ID upfront
    const timestamp = Date.now();

    console.log(`[BROADCAST] Start: ${broadcastId} by ${requesterUid}`);

    try {
        // 1. Validate Requester (MD Check)
        // 1. Validate Requester (MD Check)
        console.log(`[BROADCAST] Security Check for: ${requesterUid}`);

        let requesterSnap = await db.ref(`employees/${requesterUid}`).once('value');
        let requester = requesterSnap.val();
        let source = 'employees';

        if (!requester) {
            requesterSnap = await db.ref(`users/${requesterUid}`).once('value');
            requester = requesterSnap.val();
            source = 'users';
        }

        console.log(`[BROADCAST] Found User in ${source}:`, requester ? 'YES' : 'NO');
        if (requester) console.log(`[BROADCAST] Role: '${requester.role}'`);

        const role = requester?.role?.toLowerCase() || '';

        if (!requester || (role !== 'md' && role !== 'owner')) {
            console.warn(`[BROADCAST] Security Violation: User ${requesterUid} (Role: ${requester?.role}) attempted broadcast.`);
            return res.status(403).json({ error: 'Unauthorized: MD Role Required' });
        }

        // 2. Fetch Audience (Active Employees Only)
        // Spec Section 4.1: Eligible if role=employee AND isActive=true AND has tokens
        const employeesSnap = await db.ref('employees').once('value');
        const employees = employeesSnap.val() || {};

        let eligibleTokens = [];
        const tokenOwnerMap = {}; // Map token -> { uid, tokenKey } for pruning

        Object.entries(employees).forEach(([uid, emp]) => {
            // Strict Eligibility Check
            // Note: We include 'MD' in finding tokens if the MD wants to test, 
            // but Spec 4.2 says "Ineligible Users: MD users (Explicitly Excluded)".
            // adhering to Spec 4.2: Exclude MDs from receiving the reminder.

            if (emp.role === 'MD' || emp.role === 'owner') return; // Exclude MD/Owner from receiving
            if (emp.isActive === false || emp.status === 'archived') return;

            if (emp.fcmTokens) {
                Object.entries(emp.fcmTokens).forEach(([key, tokenData]) => {
                    const token = tokenData.token;
                    if (typeof token === 'string' && token.length > 32) { // Basic sanity check
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
                            db.ref(`employees/${owner.uid}/fcmTokens/${owner.key}`).remove()
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
        // Store under employees/{uid}/fcmTokens/{hash}
        await db.ref(`employees/${uid}/fcmTokens/${hash}`).set({
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
        await db.ref(`employees/${uid}/fcmTokens/${hash}`).remove();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Storage Error' });
    }
};
