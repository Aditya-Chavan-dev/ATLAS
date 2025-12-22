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

        // Store exactly what we received (Concept of Truth)
        await db.ref(`fcm_tokens/${uid}`).set({
            token: token || null,
            permission: permission, // 'granted' or 'denied'
            platform: platform || 'web',
            lastUpdated: new Date().toISOString()
        });

        res.json({ success: true, message: 'Status updated' });
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
        console.log('📢 Starting Broadcast...');

        // 1. Fetch Truth Data
        const [usersSnap, tokensSnap] = await Promise.all([
            db.ref('employees').once('value'), // Use employees node where real users live
            db.ref('fcm_tokens').once('value')
        ]);

        const employees = usersSnap.val() || {};
        const fcmRecords = tokensSnap.val() || {};

        // 2. Strict Categorization
        const categorization = {
            sentTo: [],           // Target List
            failedNotInstalled: 0,
            failedPermissionsOff: 0,
            successSent: 0
        };

        const targetTokens = [];

        // Identify non-admin employees (Strict Filter)
        const employeeList = Object.values(employees)
            .filter(u => {
                const p = u.profile || u;
                return (
                    p.role !== 'admin' &&
                    p.role !== 'md' &&
                    p.role !== 'owner' &&
                    p.email &&
                    p.phone // Must be valid active employee
                );
            });

        const totalEmployees = employeeList.length;

        for (const emp of employeeList) {
            const uid = emp.uid;
            const fcm = fcmRecords[uid];

            if (!fcm) {
                // No Record -> App Not Installed
                categorization.failedNotInstalled++;
            } else if (fcm.permission === 'denied' || !fcm.token) {
                // Record Exists but Permission Denied (or missing token) -> Notification OFF
                categorization.failedPermissionsOff++;
            } else if (fcm.permission === 'granted' && fcm.token) {
                // Valid -> Add to Target
                categorization.sentTo.push(uid);
                targetTokens.push(fcm.token);
            }
        }

        // 3. Send Bulk (Data-Only)
        let fcmSuccess = 0;
        let fcmFailure = 0;

        if (targetTokens.length > 0) {
            const message = {
                data: {
                    type: 'ATTENDANCE_REMINDER',
                    route: 'MARK_ATTENDANCE', // Step 5 Route
                    date: new Date().toISOString().split('T')[0],
                    // We DO NOT add notification: {} object here.
                },
                tokens: targetTokens
            };

            const response = await messaging.sendEachForMulticast(message);
            fcmSuccess = response.successCount;
            fcmFailure = response.failureCount;

            // Remove invalid tokens if any (Strict Cleanup)
            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const error = resp.error;
                        if (error.code === 'messaging/registration-token-not-registered' ||
                            error.code === 'messaging/invalid-argument') {
                            const failedUid = categorization.sentTo[idx]; // Map back using index
                            console.log(`Removing invalid token for ${failedUid}`);
                            db.ref(`fcm_tokens/${failedUid}/token`).remove();
                            db.ref(`fcm_tokens/${failedUid}/permission`).set('denied'); // Downgrade status
                        }
                    }
                });
            }
        }

        // 4. Final Response (Step 8 Data Model)
        // Sent To = Total we TRIED to send to (which equals success + specific failures, but user asked for Truth based on stored data)
        // User Spec:
        // Notifications Sent To -> Total employees with app installed (permission ON + OFF) ?? sentTo usually means target.
        // Wait, Spec says: "Notifications Sent To -> Total employees with app installed (permission ON + OFF)"
        // This definition is slightly weird. "Sent To" usually implies the active target.
        // But the example clarifies:
        // "4 have app + ON, 1 has app + OFF, 2 never installed" -> "Notifications Sent To: 5"
        // So "Sent To" = Installed (ON + OFF).
        // My Logic:
        // Installed = (granted + token) + (denied/no-token but record) = categorization.sentTo.length + categorization.failedPermissionsOff

        const countInstalledON = categorization.sentTo.length;
        const countInstalledOFF = categorization.failedPermissionsOff;
        const countNotInstalled = categorization.failedNotInstalled;

        const summary = {
            totalEmployees: totalEmployees,
            sentTo: countInstalledON + countInstalledOFF, // "Total with app installed"
            successfullySent: fcmSuccess,
            failedNotInstalled: countNotInstalled,
            permissionDenied: countInstalledOFF // "Couldn't reach (notifications turned off)"
        };

        // Clarifiction on "Successfully Sent":
        // If 5 people installed. 4 ON. 1 OFF.
        // We try to send to 4. 
        // If FCM says 4 success.
        // Then successfullySent = 4.
        // The modal spec names:
        // - Notifications Sent To (Total Installed)
        // - Successfully Sent (FCM success)
        // - Failed (App not installed) (Never installed)
        // - Couldn't Reach (Notifications turned off) (Installed but Off)

        res.json({
            success: true,
            summary: summary
        });

    } catch (error) {
        console.error('Broadcast Error:', error);
        res.status(500).json({ error: error.message });
    }
};
