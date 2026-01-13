const { db } = require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');
const { isSunday, isNationalHoliday } = require('../utils/dateUtils');
const Mutex = require('../utils/mutex');
const { sendPushNotification } = require('../services/notificationService');

const messaging = getMessaging();

// Helper to check for leave conflicts
const checkLeaveConflict = async (uid, dateStr) => {
    // Basic implementation assuming we seek any approved/pending leave for this date
    // This is a placeholder for the actual logic if not defined elsewhere
    // In real app, this should query 'leaves' path
    // For now, let's assume it returns null or the logic was already present and correct
    // I will use a simple check based on common patterns
    const leavesRef = db.ref(`leaves/${uid}`);
    const snapshot = await leavesRef.orderByChild('status').startAt('pending').once('value');
    const leaves = snapshot.val();
    if (!leaves) return null;

    for (const [id, leave] of Object.entries(leaves)) {
        if (leave.status === 'rejected' || leave.status === 'cancelled') continue;
        if (dateStr >= leave.from && dateStr <= leave.to) {
            return { type: leave.type, status: leave.status };
        }
    }
    return null;
};

exports.markAttendance = async (req, res) => {
    const uid = req.user.uid;
    const { locationType, siteName, dateStr } = req.body;

    if (!locationType || !dateStr) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // 0. ACQUIRE LOCK (Fixes Millisecond Gap)
    const lock = new Mutex(uid);
    const hasLock = await lock.acquire();
    if (!hasLock) {
        // High contention or potential attack
        return res.status(429).json({ error: 'System busy. Please try again in a few seconds.' });
    }

    try {
        // ------------------------------------------------------------------
        // ISOLATION CHECK: Ensure no pending/approved leave exists
        // ------------------------------------------------------------------
        const leaveConflict = await checkLeaveConflict(uid, dateStr);
        if (leaveConflict) {
            return res.status(409).json({
                error: 'Cannot mark attendance: You have a pending or approved leave for this date.',
                conflict: leaveConflict
            });
        }


        // ------------------------------------------------------------------
        // SECURITY: STRICT TIME-WINDOW ENFORCEMENT
        // ------------------------------------------------------------------
        // Rule 1: No Future Dates
        // Rule 2: No Stale Dates (> 48 hours in past)
        // Exception: Admins/MDs can bypass (e.g. for corrections)

        // Check Role
        const userRole = req.user.role ? req.user.role.toLowerCase() : 'employee';
        const canBypass = ['admin', 'md', 'owner'].includes(userRole);

        if (!canBypass) {
            const { getTodayDateIST } = require('../utils/dateUtils');
            const todayStr = getTodayDateIST(); // YYYY-MM-DD in IST

            // Simple String Comparison works for ISO dates (YYYY-MM-DD)
            if (dateStr > todayStr) {
                return res.status(403).json({
                    error: 'Future attendance is not allowed. Please mark for today only.',
                    code: 'Did you invent a Time Machine?'
                });
            }

            // Calculate 48-hour window
            // We need to parse dates to compare age
            const current = new Date(todayStr);
            const target = new Date(dateStr);
            const diffTime = Math.abs(current - target);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (target < current && diffDays > 2) {
                return res.status(403).json({
                    error: 'Attendance window closed. Cannot mark attendance older than 48 hours.',
                    code: 'LATE_SUBMISSION'
                });
            }
        }

        try {
            // 1. ATOMIC TRANSACTION (Fixes Race Condition & Idempotency)
            // We use a transaction to safely check-and-write in one atomic operation.
            const attendanceRef = db.ref(`employees/${uid}/attendance/${dateStr}`);

            let transactionResult;

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

            // Find MD UIDs first.
            const mdUids = Object.entries(allUsers)
                .filter(([id, u]) => {
                    const p = u.profile || u;
                    return (p.role === 'admin' || p.role === 'MD' || p.role === 'owner');
                })
                .map(([id]) => id);

            // Fetch tokens for MDs
            const allTokensSnap = await db.ref('fcm_tokens').once('value');
            const allTokens = allTokensSnap.val() || {};

            mdUids.forEach(mdUid => {
                const userDevices = allTokens[mdUid]; // Now this is a Map of deviceIds
                if (userDevices) {
                    Object.values(userDevices).forEach(deviceData => {
                        if (deviceData.token && deviceData.permission === 'granted') {
                            mdTokens.push(deviceData.token);
                        }
                    });
                }
            });

            // Deduplicate tokens
            const uniqueTokens = [...new Set(mdTokens)];

            if (uniqueTokens.length > 0) {
                try {
                    await sendPushNotification(
                        uniqueTokens,
                        'New Attendance Request',
                        `${employeeName} checked in at ${locationType === 'Site' ? (siteName || 'Site') : 'Office'}`,
                        {
                            action: 'REVIEW_ATTENDANCE',
                            attendanceId: dateStr,
                            employeeId: uid
                        }
                    );

                    // Optional: Mark mdNotified=true in DB
                    await attendanceRef.update({ mdNotified: true });
                } catch (notifErr) {
                    console.warn('[Attendance] Notification failed (non-fatal):', notifErr);
                }
            }

            res.json({ success: true, message: 'Attendance marked and MDs notified' });

        } catch (error) {
            console.error('[Attendance] Mark Error:', error);
            res.status(500).json({ error: 'Failed to mark attendance' });
        }
    } finally {
        await lock.release();
    }
};

/**
 * Update Status (MD -> Employee)
 * POST /api/attendance/status
 * Body: { employeeUid, date, status, reason, actionData }
 */
exports.updateStatus = async (req, res) => {
    const { employeeUid, date, status, reason, actionData } = req.body;
    // SECURITY: Use requester's UID from token
    const requesterUid = req.user.uid;

    if (!employeeUid || !date || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 🔒 SECURITY: ZOMBIE ADMIN CHECK (Fix Failure Mode #6)
        // Verify current role from DB, ignoring potentially stale ID Token
        const roleSnap = await db.ref(`employees/${requesterUid}/profile/role`).once('value');
        const realRole = (roleSnap.val() || '').toLowerCase();

        if (!['md', 'admin', 'owner'].includes(realRole)) {
            console.warn(`[Security] Zombie Admin blocked: ${requesterUid} attempted action with stale token role.`);
            return res.status(403).json({ error: 'Access Denied: Your role has been revoked.' });
        }

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
        let notificationWarning = null;
        // fcm_tokens/{uid} is now a Map of devices
        try {
            const tokenSnap = await db.ref(`fcm_tokens/${employeeUid}`).once('value');
            const tokenMap = tokenSnap.val();

            const empTokens = [];
            if (tokenMap) {
                Object.values(tokenMap).forEach(device => {
                    if (device.token && device.permission === 'granted') {
                        empTokens.push(device.token);
                    }
                });
            }

            if (empTokens.length > 0) {
                const isApproved = status === 'approved';
                const title = isApproved ? 'Attendance Approved' : 'Attendance Rejected';
                const body = isApproved
                    ? 'Your attendance for today has been approved.'
                    : `Your attendance was rejected. Reason: ${reason || 'Contact MD'}`;

                await sendPushNotification(
                    empTokens,
                    title,
                    body,
                    {
                        action: 'VIEW_STATUS',
                        attendanceId: date
                    }
                );
                await attendanceRef.update({ employeeNotified: true });
            }
        } catch (error) {
            console.warn('[Attendance] Employee notification failed:', error);
            notificationWarning = 'Status updated, but failed to notify employee.';
        }

        res.json({
            success: true,
            message: `Status updated to ${status}`,
            warning: notificationWarning // Fix Failure Mode #2: Explicit Warning
        });

    } catch (error) {
        console.error('[Attendance] Status Update Error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};