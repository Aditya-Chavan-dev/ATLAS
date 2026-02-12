const { db } = require('../config/firebase');
const { isSunday, isNationalHoliday, getTodayDateIST } = require('../utils/dateUtils'); // ✅ Imported getTodayDateIST
const Mutex = require('../utils/mutex');
const { sendPushNotification, notifyAdmins } = require('../services/notificationService'); // ✅ Added notifyAdmins
const catchAsync = require('../utils/asyncHandler'); // ✅ Added catchAsync

// Helper to check for leave conflicts
const checkLeaveConflict = async (uid, dateStr) => {
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

exports.markAttendance = catchAsync(async (req, res) => {
    const uid = req.user.uid;
    const { locationType, siteName, dateStr } = req.body;

    if (!locationType || !dateStr) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // 0. ACQUIRE LOCK
    const lock = new Mutex(uid);
    const hasLock = await lock.acquire();
    if (!hasLock) {
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
        const userRole = req.user.role ? req.user.role.toLowerCase() : 'employee';
        const canBypass = ['admin', 'md', 'owner'].includes(userRole);

        if (!canBypass) {
            const todayStr = getTodayDateIST();

            if (dateStr > todayStr) {
                return res.status(403).json({
                    error: 'Future attendance is not allowed. Please mark for today only.',
                    code: 'Did you invent a Time Machine?'
                });
            }

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

        // 1. ATOMIC TRANSACTION
        const attendanceRef = db.ref(`employees/${uid}/attendance/${dateStr}`);
        let transactionResult;

        transactionResult = await attendanceRef.transaction((currentData) => {
            if (currentData) {
                if (currentData.status === 'approved' || currentData.status === 'Present') {
                    return undefined;
                }
                return undefined; // Strict Idempotency
            }

            const isHoliday = isNationalHoliday(dateStr);
            const isSun = isSunday(dateStr);
            let status = 'pending';
            let statusNote = null;

            if (isHoliday || isSun) {
                status = 'pending_co';
                statusNote = isHoliday ? 'Worked on National Holiday' : 'Worked on Sunday';
            }

            return {
                status: status,
                timestamp: new Date().toISOString(), // Server Timestamp
                locationType,
                siteName: siteName || null,
                mdNotified: false,
                specialNote: statusNote
            };
        });

        if (!transactionResult.committed) {
            const existingSnap = await attendanceRef.once('value');
            return res.status(409).json({
                error: 'Attendance already marked for this date',
                existing: existingSnap.val()
            });
        }

        const newRecord = transactionResult.snapshot.val();

        // 3. Fetch user profile for name
        const userSnap = await db.ref(`employees/${uid}/profile`).once('value');
        const userData = userSnap.val() || {};
        const employeeName = userData.name || 'Employee';

        // 4. SECURE INBOX PATTERN
        const inboxRef = db.ref(`pending_admin_inbox/attendance/${dateStr}/${uid}`);
        await inboxRef.set({
            uid: uid,
            name: employeeName,
            timestamp: newRecord.timestamp,
            status: newRecord.status,
            locationType: newRecord.locationType,
            siteName: newRecord.siteName,
            reason: newRecord.specialNote || null,
            actionRequired: true
        });

        // 5. Notify MDs/Admins (Optimized)
        // ✅ REPLACED 40 lines with 1 line
        await notifyAdmins(
            'New Attendance Request',
            `${employeeName} checked in at ${locationType === 'Site' ? (siteName || 'Site') : 'Office'}`,
            { action: 'REVIEW_ATTENDANCE', attendanceId: dateStr, employeeId: uid }
        );
        await attendanceRef.update({ mdNotified: true });

        res.json({ success: true, message: 'Attendance marked and sent for approval' });

    } finally {
        await lock.release();
    }
});

exports.updateStatus = catchAsync(async (req, res) => {
    const { employeeUid, date, status, reason, actionData } = req.body;
    // Security: Auth check is now handled by middleware (Zero-Trust)

    if (!employeeUid || !date || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Update Firebase
    const attendanceRef = db.ref(`employees/${employeeUid}/attendance/${date}`);
    let finalStatus = status;
    let balanceUpdateMsg = null;

    if (status === 'approved') {
        finalStatus = 'Present';
        const isHoliday = isNationalHoliday(date);
        const isSun = isSunday(date);

        if (isHoliday || isSun) {
            const balanceRef = db.ref(`employees/${employeeUid}/leaveBalance/co`);
            await balanceRef.transaction((current) => (current || 0) + 1);
            balanceUpdateMsg = `Earned 1 CO for working on ${isHoliday ? 'Holiday' : 'Sunday'}`;
        }
    }

    const updates = {
        status: finalStatus,
        actionTimestamp: Date.now(),
        approvedAt: status === 'approved' ? new Date().toISOString() : null,
        rejectedAt: status === 'rejected' ? new Date().toISOString() : null,
        handledBy: actionData?.name || 'MD',
        mdReason: reason || balanceUpdateMsg || null,
        employeeNotified: false
    };

    if (status === 'approved') updates.isCorrection = false;

    await attendanceRef.update(updates);

    // Audit Log
    await db.ref('audit').push({
        actor: actionData?.name || 'MD',
        action: status === 'approved' ? 'approveAttendance' : 'rejectAttendance',
        target: { employeeId: employeeUid, date: date },
        details: { newStatus: status, reason },
        timestamp: Date.now()
    });

    // 2. Notify Employee
    const tokenSnap = await db.ref(`fcm_tokens/${employeeUid}`).once('value');
    const tokenMap = tokenSnap.val();
    const empTokens = tokenMap ? Object.values(tokenMap)
        .filter(d => d.token && d.permission === 'granted')
        .map(d => d.token) : [];

    if (empTokens.length > 0) {
        const isApproved = status === 'approved';
        await sendPushNotification(
            empTokens,
            isApproved ? 'Attendance Approved' : 'Attendance Rejected',
            isApproved ? 'Your attendance for today has been approved.' : `Reason: ${reason || 'Contact MD'}`,
            { action: 'VIEW_STATUS', attendanceId: date }
        );
        await attendanceRef.update({ employeeNotified: true });
    }

    res.json({
        success: true,
        message: `Status updated to ${status}`,
        warning: empTokens.length === 0 ? 'Status updated, but failed to notify employee.' : null
    });
});