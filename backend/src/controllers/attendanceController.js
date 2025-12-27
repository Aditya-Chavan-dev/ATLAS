const { db } = require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');
const { isSunday, isNationalHoliday } = require('../utils/dateUtils');

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
 * Body: { locationType, siteName, dateStr }
 * NOTE: uid is taken from authenticated token, NOT from body (IDOR prevention)
 */
exports.markAttendance = async (req, res) => {
    // SECURITY: Use authenticated user's UID, not user-supplied UID
    const uid = req.user.uid;
    const { locationType, siteName, dateStr } = req.body;

    if (!locationType || !dateStr) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. ATOMIC TRANSACTION (Fixes Race Condition & Idempotency)
        // We use a transaction to safely check-and-write in one atomic operation.
        const attendanceRef = db.ref(`employees/${uid}/attendance/${dateStr}`);

        let transactionResult;
        let finalSnapshot;

        try {
            transactionResult = await attendanceRef.transaction((currentData) => {
                // If data exists, check if it's already final/approved
                if (currentData) {
                    if (currentData.status === 'approved' || currentData.status === 'Present') {
                        // Abort transaction - already final
                        return undefined;
                    }
                    // If pending/rejected, we MIGHT allow overwrite depending on rules,
                    // but for strict idempotency ("Double Tap"), we should abort if *any* record exists 
                    // unless it's a specific "retry" case. 
                    // Let's assume STRICT Idempotency: If Record Exists, Abort.
                    return undefined;
                }

                // DATA DOES NOT EXIST (or we are overwriting - behavior decision)
                // Returning the new object creates/overwrites the data

                // STRICT FLOW: Check for Holiday/Sunday (Calculated inside transaction scope implies safety)
                const isHoliday = isNationalHoliday(dateStr);
                const isSun = isSunday(dateStr);

                let status = 'pending';
                let statusNote = null;

                if (isHoliday || isSun) {
                    status = 'pending_co';
                    statusNote = isHoliday ? 'Worked on National Holiday' : 'Worked on Sunday';
                }

                // 2. SERVER-SIDE TIMESTAMP (Fixes Time Integrity LEAK #2)
                // Use ISO string generated on SERVER, ignore client timestamp
                const serverTimestamp = new Date().toISOString();

                return {
                    status: status,
                    timestamp: serverTimestamp,
                    locationType,
                    siteName: siteName || null,
                    mdNotified: false,
                    specialNote: statusNote
                };
            });
        } catch (txError) {
            console.error('[Attendance] Transaction Failed:', txError);
            throw txError;
        }

        if (!transactionResult.committed) {
            // Transaction aborted because data existed (returned undefined)
            // Fetch what is there to show the user
            const existingSnap = await attendanceRef.once('value');
            const existing = existingSnap.val();

            return res.status(409).json({
                error: 'Attendance already marked for this date',
                existing: existing
            });
        }

        // Transaction Valid & Committed
        const newRecord = transactionResult.snapshot.val();
        console.log(`[Attendance] Transaction Committed for ${uid}:`, newRecord.status);

        // 3. Fetch user profile for name (Post-Transaction)
        const userSnap = await db.ref(`employees/${uid}/profile`).once('value');
        const userData = userSnap.val() || {};
        const employeeName = userData.name || 'Employee';
        console.log(`[Attendance] Marked for ${employeeName} (${uid})`);

        // 2. Notify MDs
        // Fetch all employees to find MDs
        // Scan employees node, check profile.role
        const allUsersSnap = await db.ref('employees').once('value');
        const allUsers = allUsersSnap.val() || {};

        const mdTokens = [];

        Object.values(allUsers).forEach(user => {
            const profile = user.profile || user; // Handle nested or flat
            // Need to get tokens. Where are they? 
            // notificationController uses fcm_tokens/{uid}.
            // So we can't find tokens in 'employees' unless we fetch fcm_tokens.
            // But wait, the original code looked in user.fcmTokens.
            // If we moved to fcm_tokens collection, we must fetch from there.
            // Let's assume fcm_tokens is the source of truth for tokens now.
        });

        // RE-FETCH tokens from fcm_tokens for MDs
        // Inefficient to scan all tokens, but okay for small scale.
        // Better: Find MD UIDs first.
        const mdUids = Object.entries(allUsers)
            .filter(([id, u]) => {
                const p = u.profile || u;
                return (p.role === 'admin' || p.role === 'MD' || p.role === 'owner');
            })
            .map(([id]) => id);

        const allTokensSnap = await db.ref('fcm_tokens').once('value');
        const allTokens = allTokensSnap.val() || {};

        mdUids.forEach(mdUid => {
            const tData = allTokens[mdUid];
            if (tData && tData.token && tData.permission === 'granted') {
                mdTokens.push(tData.token);
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
        // Target: employees/{employeeUid}/attendance/{date}
        const attendanceRef = db.ref(`employees/${employeeUid}/attendance/${date}`);

        // Resolve Final Status per Strict Rules
        let finalStatus = status;
        let balanceUpdateMsg = null;

        if (status === 'approved') {
            finalStatus = 'Present'; // Map action 'approved' to state 'Present'

            // CO Earning Logic
            const isHoliday = isNationalHoliday(date);
            const isSun = isSunday(date);

            if (isHoliday || isSun) {
                // Earned CO
                // Balance is ... where? user said "No legacy nodes".
                // Ideally profile.leaveBalance? Or leaves/balance?
                // leaveController checks `employees/${employeeId}/leaveBalance`.
                // PROMPT didn't specify leave balance location.
                // I will put it in `employees/${employeeUid}/profile/leaveBalance` to be safe/consistent?
                // Or `leaves/${employeeUid}/balance`?
                // Let's stick to legacy path for balance if not specified, OR move to profile.
                // "No legacy nodes remain" -> `users` is legacy.
                // So `employees/${employeeUid}/leaveBalance` seems best as a sibling to profile, or inside profile.
                // Let's use `employees/${employeeUid}/leaveBalance`.
                const balanceRef = db.ref(`employees/${employeeUid}/leaveBalance/co`);
                await balanceRef.transaction((current) => (current || 0) + 1);
                balanceUpdateMsg = `Earned 1 CO for working on ${isHoliday ? 'Holiday' : 'Sunday'}`;
                console.log(`[Attendance] ${balanceUpdateMsg} - ${employeeUid}`);
            }
        }

        // Prepare update object matching your existing schema
        const updates = {
            status: finalStatus,
            actionTimestamp: Date.now(),
            approvedAt: status === 'approved' ? new Date().toISOString() : null,
            rejectedAt: status === 'rejected' ? new Date().toISOString() : null,
            handledBy: actionData?.name || 'MD',
            mdReason: reason || balanceUpdateMsg || null,
            employeeNotified: false
        };

        // Handle correction logic if needed
        if (status === 'approved') {
            updates.isCorrection = false;
        }

        await attendanceRef.update(updates);
        console.log(`[Attendance] Status updated to ${finalStatus} for ${employeeUid}`);

        // Audit Log (Preserving your existing audit logic)
        await db.ref('audit').push({
            actor: actionData?.name || 'MD',
            action: status === 'approved' ? 'approveAttendance' : 'rejectAttendance',
            target: { employeeId: employeeUid, date: date },
            details: { newStatus: status, reason },
            timestamp: Date.now()
        });

        // 2. Notify Employee
        // 2. Notify Employee
        // Fetch token from fcm_tokens/{uid}
        const tokenSnap = await db.ref(`fcm_tokens/${employeeUid}`).once('value');
        const tokenData = tokenSnap.val();

        const empTokens = [];
        if (tokenData && tokenData.token && tokenData.permission === 'granted') {
            empTokens.push(tokenData.token);
        }

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
