const { db, admin } = require('../config/firebase');
const { sendPushNotification, notifyAdmins } = require('../services/notificationService'); // ✅ notifyAdmins
const { getTodayDateIST, getLeaveDaysCount } = require('../utils/dateUtils');
const Mutex = require('../utils/mutex');
const catchAsync = require('../utils/asyncHandler'); // ✅ catchAsync

// Helper: Log Leave History (Audit)
const logLeaveHistory = async (uid, action, leaveData, actorId, actorRole, details = {}) => {
    try {
        await db.ref('audit').push({
            actor: actorId,
            actorRole: actorRole,
            action: `leave_${action}`,
            target: { uid, leaveId: leaveData.leaveId },
            timestamp: admin.database.ServerValue.TIMESTAMP,
            details: {
                ...details,
                leaveType: leaveData.type,
                days: leaveData.totalDays
            }
        });
    } catch (e) {
        console.warn('[Audit] Failed to log leave history:', e);
    }
};

const checkLeaveOverlap = async (uid, from, to) => {
    const leavesRef = db.ref(`leaves/${uid}`);
    const snapshot = await leavesRef.orderByChild('status').startAt('pending').once('value'); // Optimized Check
    const leaves = snapshot.val();
    if (!leaves) return null;

    for (const leave of Object.values(leaves)) {
        if (leave.status === 'rejected' || leave.status === 'cancelled') continue;
        if (from <= leave.to && to >= leave.from) return leave;
    }
    return null;
};

exports.applyLeave = catchAsync(async (req, res) => {
    const employeeId = req.user.uid;
    const { employeeName, type, from, to, reason } = req.body;

    // 0. ACQUIRE LOCK
    const lock = new Mutex(employeeId);
    const hasLock = await lock.acquire();
    if (!hasLock) {
        return res.status(429).json({ error: 'System busy. Please try again.' });
    }

    try {
        const TodayIST = getTodayDateIST();

        // Basic Validation
        if (from < TodayIST) throw { statusCode: 400, message: 'Cannot apply for past dates' };
        if (to < from) throw { statusCode: 400, message: 'End date must be after start date' };

        const totalDays = getLeaveDaysCount(from, to);
        if (totalDays > 30) throw { statusCode: 400, message: 'Leave duration cannot exceed 30 days' };

        // STRICT BALANCE CHECK
        const balSnap = await db.ref(`employees/${employeeId}/leaveBalance`).once('value');
        const balance = balSnap.val() || { pl: 17, co: 0 };

        if (type === 'PL' && balance.pl < totalDays) {
            throw { statusCode: 400, message: `Insufficient PL Balance. Available: ${balance.pl}` };
        } else if (type === 'CO' && balance.co < totalDays) {
            throw { statusCode: 400, message: `Insufficient Comp Off Balance. Available: ${balance.co}` };
        }

        // DUPLICATE/OVERLAP CHECK
        const conflict = await checkLeaveOverlap(employeeId, from, to);
        if (conflict) {
            throw { statusCode: 409, message: 'You already have a leave for these dates.' };
        }

        // Apply
        const leaveRef = db.ref(`leaves/${employeeId}`).push();
        const leaveId = leaveRef.key;

        const leaveData = {
            leaveId, employeeId, employeeName, type, from, to, totalDays, reason,
            status: 'pending',
            appliedAt: admin.database.ServerValue.TIMESTAMP
        };

        await leaveRef.set(leaveData);
        await logLeaveHistory(employeeId, 'applied', leaveData, employeeId, 'employee');

        // Notify MD (Optimized)
        await notifyAdmins(
            '📝 New Leave Request',
            `${employeeName} applied for ${type} (${totalDays} days)`,
            { type: 'LEAVE_REQUEST', leaveId }
        );

        res.status(201).json({ success: true, leaveId });

    } finally {
        await lock.release();
    }
});

exports.getHistory = catchAsync(async (req, res) => {
    const { employeeId } = req.params;
    const snapshot = await db.ref(`leaves/${employeeId}`).once('value');
    const leaves = snapshot.val() || {};
    res.json(Object.values(leaves));
});

exports.approveLeave = catchAsync(async (req, res) => {
    const { leaveId, employeeId, mdId } = req.body;
    // Security: Auth check is now handled by middleware (Zero-Trust)

    const leaveRef = db.ref(`leaves/${employeeId}/${leaveId}`);

    // 1. LOCKING PHASE: Prevent Race Conditions (Double Deduction)
    const transactionResult = await leaveRef.child('status').transaction((currentStatus) => {
        if (currentStatus === 'pending') return 'processing';
        return undefined; // Abort
    });

    if (!transactionResult.committed) {
        return res.status(409).json({ error: 'Leave request is already being processed or finalized.' });
    }

    const snapshot = await leaveRef.once('value');
    const leave = snapshot.val();

    // 2. DEDUCTION PHASE
    const balanceRef = db.ref(`employees/${employeeId}/leaveBalance`);

    try {
        await balanceRef.transaction((current) => {
            const bal = current || { pl: 17, co: 0 };
            const cost = leave.totalDays;

            if (leave.type === 'PL') {
                if (bal.pl < cost) throw new Error('INSUFFICIENT_PL');
                bal.pl -= cost;
            } else if (leave.type === 'CO') {
                if (bal.co < cost) throw new Error('INSUFFICIENT_CO');
                bal.co -= cost;
            }
            return bal;
        });
    } catch (err) {
        console.warn(`[Leave] Insufficient funds for ${leaveId}, reverting lock.`);
        await leaveRef.update({ status: 'pending' }); // Revert
        return res.status(400).json({ error: 'Insufficient balance to approve leave.' });
    }

    // 3. FINALIZATION PHASE
    await leaveRef.update({
        status: 'approved',
        actedAt: admin.database.ServerValue.TIMESTAMP,
        actorId: mdId,
        actorRole: 'MD'
    });

    await logLeaveHistory(employeeId, 'approved', leave, mdId, 'MD');

    // 4. NOTIFICATION (To Employee)
    const userSnap = await db.ref(`employees/${employeeId}/profile`).once('value');
    const user = userSnap.val();
    if (user && user.fcmToken) {
        await sendPushNotification([user.fcmToken], '✅ Leave Approved', `Your ${leave.type} request has been approved.`);
    }

    res.json({ success: true, message: 'Leave approved.' });
});

exports.rejectLeave = catchAsync(async (req, res) => {
    const { leaveId, employeeId, mdId, reason } = req.body;
    // Security: Auth check is now handled by middleware (Zero-Trust)

    const leaveRef = db.ref(`leaves/${employeeId}/${leaveId}`);
    const snapshot = await leaveRef.once('value');
    const leave = snapshot.val();

    if (!leave || leave.status !== 'pending') return res.status(400).json({ error: 'Invalid leave request' });

    await leaveRef.update({
        status: 'rejected',
        actedAt: admin.database.ServerValue.TIMESTAMP,
        actorId: mdId,
        actorRole: 'MD',
        rejectionReason: reason
    });

    await logLeaveHistory(employeeId, 'rejected', leave, mdId, 'MD', { reason });

    // Notify Employee
    const userSnap = await db.ref(`employees/${employeeId}/profile`).once('value');
    const user = userSnap.val();
    if (user && user.fcmToken) {
        await sendPushNotification([user.fcmToken], '❌ Leave Rejected', `Your leave request was rejected.`);
    }

    res.json({ success: true });
});

exports.cancelLeave = catchAsync(async (req, res) => {
    const employeeId = req.user.uid;
    const { leaveId, reason } = req.body;

    const leaveRef = db.ref(`leaves/${employeeId}/${leaveId}`);
    const snapshot = await leaveRef.once('value');
    const leave = snapshot.val();

    if (!leave || leave.status !== 'pending') return res.status(400).json({ error: 'Only pending leaves can be cancelled' });

    await leaveRef.update({
        status: 'cancelled',
        actedAt: admin.database.ServerValue.TIMESTAMP,
        actorId: employeeId,
        actorRole: 'employee'
    });

    await logLeaveHistory(employeeId, 'cancelled', leave, employeeId, 'employee', { reason });

    // Notify MD (Optimized)
    await notifyAdmins(
        '🚫 Leave Cancelled',
        `${leave.employeeName} cancelled their request.`,
        { action: 'LEAVE_CANCELLED', leaveId }
    );

    res.json({ success: true });
});
