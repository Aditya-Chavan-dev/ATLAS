const { db } = require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');

const messaging = getMessaging();

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

/**
 * Send Multicast Notification
 * @param {Array} tokens - List of FCM tokens
 * @param {Object} notification - { title, body }
 * @param {Object} data - Custom data payload
 */
const sendMulticast = async (tokens, notification, data) => {
    if (!tokens || tokens.length === 0) return { success: 0, failure: 0 };

    const message = {
        notification,
        data,
        tokens
    };

    try {
        const response = await messaging.sendEachForMulticast(message);
        console.log(`[FCM] Sent: ${response.successCount}, Failed: ${response.failureCount}`);
        return response;
    } catch (error) {
        console.error('[FCM] Multicast Error:', error);
        throw error;
    }
};

// ------------------------------------------------------------------
// CONTROLLER METHODS
// ------------------------------------------------------------------

/**
 * Mark Attendance (Employee -> MD)
 * POST /api/attendance/mark
 * Body: { uid, locationType, siteName, timestamp, dateStr }
 */
exports.markAttendance = async (req, res) => {
    const { uid, locationType, siteName, timestamp, dateStr } = req.body;

    if (!uid || !locationType || !dateStr) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Write to Firebase (Transactional Source of Truth)
        const attendanceRef = db.ref(`users/${uid}/attendance/${dateStr}`);

        // Fetch user profile for name
        const userSnap = await db.ref(`users/${uid}`).once('value');
        const userData = userSnap.val() || {};
        const employeeName = userData.name || 'Employee';

        const updateData = {
            status: 'pending',
            timestamp: timestamp || new Date().toISOString(),
            locationType,
            siteName: siteName || null,
            mdNotified: false // Flag for idempotency logic if needed detailed tracking
        };

        await attendanceRef.update(updateData);
        console.log(`[Attendance] Marked for ${employeeName} (${uid})`);

        // 2. Notify MDs
        // Fetch all users to find MDs
        // In a large app, you'd index by role. For now, scan is okay for <100 users.
        const allUsersSnap = await db.ref('users').once('value');
        const allUsers = allUsersSnap.val() || {};

        const mdTokens = [];

        Object.values(allUsers).forEach(user => {
            if ((user.role === 'admin' || user.role === 'MD' || user.role === 'owner') && user.fcmTokens) {
                // Collect tokens
                Object.values(user.fcmTokens).forEach(t => {
                    if (t.token) mdTokens.push(t.token);
                });
            }
        });

        // Deduplicate tokens
        const uniqueTokens = [...new Set(mdTokens)];

        if (uniqueTokens.length > 0) {
            await sendMulticast(
                uniqueTokens,
                {
                    title: 'New Attendance Request',
                    body: `${employeeName} checked in at ${locationType === 'Site' ? (siteName || 'Site') : 'Office'}`
                },
                {
                    action: 'REVIEW_ATTENDANCE',
                    attendanceId: dateStr,
                    employeeId: uid
                }
            );

            // Optional: Mark mdNotified=true in DB
            await attendanceRef.update({ mdNotified: true });
        }

        res.json({ success: true, message: 'Attendance marked and MDs notified' });

    } catch (error) {
        console.error('[Attendance] Mark Error:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};

/**
 * Update Status (MD -> Employee)
 * POST /api/attendance/status
 * Body: { employeeUid, date, status, reason, actionData }
 */
exports.updateStatus = async (req, res) => {
    const { employeeUid, date, status, reason, actionData } = req.body;

    if (!employeeUid || !date || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Update Firebase
        const attendanceRef = db.ref(`users/${employeeUid}/attendance/${date}`);

        // Prepare update object matching your existing schema
        const updates = {
            status: status,
            actionTimestamp: Date.now(),
            approvedAt: status === 'approved' ? new Date().toISOString() : null,
            rejectedAt: status === 'rejected' ? new Date().toISOString() : null,
            handledBy: actionData?.name || 'MD',
            mdReason: reason || null,
            employeeNotified: false
        };

        // Handle correction logic if needed
        if (status === 'approved') {
            updates.isCorrection = false;
        }

        await attendanceRef.update(updates);
        console.log(`[Attendance] Status updated to ${status} for ${employeeUid}`);

        // Audit Log (Preserving your existing audit logic)
        await db.ref('audit').push({
            actor: actionData?.name || 'MD',
            action: status === 'approved' ? 'approveAttendance' : 'rejectAttendance',
            target: { employeeId: employeeUid, date: date },
            details: { newStatus: status, reason },
            timestamp: Date.now()
        });

        // 2. Notify Employee
        const empSnap = await db.ref(`employees/${employeeUid}`).once('value'); // Check employees node first for tokens
        // Fallback to checking nested fcmTokens if your schema was users-based
        // Based on user context, tokens seem to be in employees/{uid}/fcmTokens or users/{uid}/fcmTokens
        // Let's check both or consolidate. The provided info says `employees/{uid}/fcmTokens` in the request.

        const empTokensMap = (empSnap.val() && empSnap.val().fcmTokens) || {};
        const empTokens = Object.values(empTokensMap).map(t => t.token);

        if (empTokens.length > 0) {
            const isApproved = status === 'approved';
            const title = isApproved ? 'Attendance Approved' : 'Attendance Rejected';
            const body = isApproved
                ? 'Your attendance for today has been approved.'
                : `Your attendance was rejected. Reason: ${reason || 'Contact MD'}`;

            await sendMulticast(
                empTokens,
                { title, body },
                {
                    action: 'VIEW_STATUS',
                    attendanceId: date
                }
            );

            await attendanceRef.update({ employeeNotified: true });
        }

        res.json({ success: true, message: `Status updated to ${status}` });

    } catch (error) {
        console.error('[Attendance] Status Update Error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};
