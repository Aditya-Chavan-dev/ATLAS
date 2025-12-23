// Notification Controller
// STRICT implementation of Step 7 (Backend Behavior)

const { db, messaging } = require('../config/firebase');

/**
 * Register Token or Status
 * Handles Step 6: "Send token to backend with... Permission status"
 */
exports.registerToken = async (req, res) => {
    try {
        const { uid, token, platform, permission } = req.body;

        if (!uid || !permission) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Token-Centric Storage (MANDATORY as per Spec)
        // Path: /deviceTokens/{token}
        // If permission denied, we might not have a token?
        // Spec says: "If permission is denied: Do NOT create a token entry. Track locally."
        // BUT we need to know for "Notifications OFF" stats?
        // Spec says: "Failed – notifications disabled".
        // If we don't store it, we can't count it efficiently unless we check all employees vs tokens?
        // Spec Part 4 "Truth Guarantee": "Which employees have... notifications disabled".
        // If we don't store "Denied", we only know "No Token".
        // "No Token" could be "Not Installed" OR "Denied".
        // Ref: "Track locally that notifications are disabled" -> Frontend.
        // Backend Broadcast: "Filter tokens where notificationsEnabled == true".
        // "Failed - notifications disabled" -> This implies we DO know?
        // Let's re-read: "If permission is denied: Do NOT create a token entry".
        // Okay. Then "Failed - notifications disabled" might be inferred if we have a token but enabled=false?
        // Or maybe we don't count them?
        // Wait, "Notifications Sent To -> Total employees with app installed (permission ON + OFF)".
        // If we don't store denied, we can't count OFF.
        // But the prompt says "Do NOT create a token entry" for denied.
        // Contradiction?
        // "Track locally that notifications are disabled".
        // "Remove invalid tokens automatically".
        // Maybe "notificationsEnabled" in schema implies we store it if it WAS enabled but then disabled?
        // If purely denied from start, maybe we don't store.
        // I will follow "Do NOT create a token entry" if permission is denied.

        if (permission === 'denied') {
            // If we want to strictly follow "Do NOT create", we just return.
            // But if we want to support "status updates", maybe we remove the existing token?
            if (token) {
                await db.ref(`deviceTokens/${token}`).remove();
            }
            return res.json({ success: true, message: 'Token removed (Permission Denied)' });
        }

        if (!token) {
            return res.status(400).json({ error: 'Token is required for granted permission' });
        }

        // Schema match
        const tokenData = {
            uid: uid,
            email: req.body.email || 'unknown', // We need email from frontend or fetch it
            platform: platform || 'web',
            notificationsEnabled: true,
            userAgent: req.headers['user-agent'] || 'unknown',
            createdAt: new Date().toISOString(), // Should probably be careful not to overwrite if exists?
            lastSeen: new Date().toISOString()
        };

        // We might want to fetch email if not provided, for completeness
        if (tokenData.email === 'unknown') {
            const userSnap = await db.ref(`employees/${uid}/profile`).once('value');
            if (userSnap.exists()) {
                tokenData.email = userSnap.val().email || 'unknown';
            }
        }

        await db.ref(`deviceTokens/${token}`).set(tokenData);

        res.json({ success: true, message: 'Token registered' });
    } catch (error) {
        console.error('Register Token Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Unregister Token (Optional, for logout)
 */
exports.unregisterToken = async (req, res) => {
    try {
        const { uid } = req.body;
        if (uid) {
            // We just remove the record, returning to "App Not Installed" state?
            // Or just remove token? "App Not Installed" means no record.
            await db.ref(`fcm_tokens/${uid}`).remove();
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error unregistering' });
    }
};

/**
 * Broadcast Logc (Step 7)
 */
exports.broadcastAttendance = async (req, res) => {
    try {
        console.log('📢 Starting Broadcast (Token-Based - Global)...');

        // 1. Fetch Tokens directly (Source of Truth)
        const tokensSnap = await db.ref('deviceTokens').once('value');
        const allTokens = tokensSnap.val() || {};

        // 2. Select Targets & Map Emails
        const targetTokens = [];
        const tokenToEmail = {}; // Map token -> email for tracking
        let countPermissionsOff = 0;
        let totalRegistered = 0;

        Object.entries(allTokens).forEach(([token, data]) => {
            totalRegistered++;
            const email = data.email || 'unknown';
            tokenToEmail[token] = email;

            if (data.notificationsEnabled) {
                targetTokens.push(token);
            } else {
                countPermissionsOff++;
            }
        });

        console.log(`[Broadcast] Found ${targetTokens.length} targets out of ${totalRegistered} tokens.`);

        // 3. Send Bulk (Data-Only Payload)
        let fcmSuccess = 0;
        let fcmFailure = 0;
        const sentEmailsSet = new Set();

        if (targetTokens.length > 0) {
            const message = {
                // Explicit Notification Block (Ensures visibility)
                notification: {
                    title: 'Attendance Reminder',
                    body: 'Mark your attendance for today'
                },
                // WebPush Options (Standard Browser Navigation)
                webpush: {
                    fcm_options: {
                        link: 'https://atlas-011.web.app/dashboard'
                    },
                    notification: {
                        tag: 'attendance_reminder',
                        renotify: true, // 🔔 Force alert/vibrate even if replacing
                        requireInteraction: true
                    }
                },
                // Data Block (For handlers)
                data: {
                    type: 'ATTENDANCE_REMINDER',
                    route: 'MARK_ATTENDANCE', // Legacy
                    action: 'MARK_ATTENDANCE', // For Service Worker
                    date: new Date().toISOString()
                },
                tokens: targetTokens
            };

            const response = await messaging.sendEachForMulticast(message);
            fcmSuccess = response.successCount;
            fcmFailure = response.failureCount;

            // Track Success & Cleanup Failure
            response.responses.forEach((resp, idx) => {
                const token = targetTokens[idx];
                if (resp.success) {
                    const email = tokenToEmail[token];
                    if (email && email !== 'unknown') {
                        sentEmailsSet.add(email);
                    }
                } else {
                    // Cleanup invalid tokens
                    const error = resp.error;
                    if (error && (error.code === 'messaging/registration-token-not-registered' ||
                        error.code === 'messaging/invalid-argument')) {
                        console.log(`Removing invalid token: ${token.substring(0, 10)}...`);
                        db.ref(`deviceTokens/${token}`).remove().catch(console.error);
                    }
                }
            });
        }

        // 4. Stats - Count & List Employees
        const employeesSnap = await db.ref('employees').once('value');
        const allEmployees = employeesSnap.val() || {};

        let actualEmployeeCount = 0;
        const notSentList = [];
        const sentList = Array.from(sentEmailsSet);

        // Analyze ALL employees to find who was missed
        Object.values(allEmployees).forEach(emp => {
            // Unify profile/root structure (Robust check)
            const profile = emp.profile || emp;
            // Robust merging for email if missing in profile but in root (like frontend fix)
            const email = profile.email || emp.email;

            const role = (profile.role || emp.role || '').toLowerCase();

            // Filter: Valid Employee? (Not MD, Has Email)
            if (role !== 'md' && email) {
                actualEmployeeCount++;

                // key check: Was it sent?
                if (!sentEmailsSet.has(email)) {
                    notSentList.push(email);
                }
            }
        });

        const summary = {
            totalEmployees: actualEmployeeCount,
            sentTo: targetTokens.length,
            successfullySent: fcmSuccess,
            failedNotInstalled: actualEmployeeCount - totalRegistered,
            permissionDenied: countPermissionsOff,
            // New Detail Fields
            details: {
                sent: sentList,
                notSent: notSentList
            }
        };

        console.log('[Broadcast] Summary:', summary);

        res.json({
            success: true,
            summary: summary
        });
    } catch (error) {
        console.error('Broadcast Error:', error);
        res.status(500).json({ error: error.message });
    }
};
