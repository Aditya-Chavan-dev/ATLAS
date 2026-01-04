const { db, admin } = require('../config/firebase');
const { sendPushNotification } = require('../services/notificationService');
const notificationService = require('../services/notificationService');
const { getTodayDateIST, getLeaveDaysCount } = require('../utils/dateUtils');
const Mutex = require('../utils/mutex');

// ... (helpers) ...

const applyLeave = async (req, res) => {
    const employeeId = req.user.uid;

    // 0. ACQUIRE LOCK
    const lock = new Mutex(employeeId);
    const hasLock = await lock.acquire();
    if (!hasLock) {
        return res.status(429).json({ error: 'System busy. Please try again.' });
    }

    try {
        // SECURITY: Use authenticated user's UID...
        const { employeeName, type, from, to, reason } = req.body;

        const TodayIST = getTodayDateIST();

        // Basic Validation
        const dFrom = new Date(from);
        const dToday = new Date(TodayIST);
        dFrom.setHours(0, 0, 0, 0);
        dToday.setHours(0, 0, 0, 0);

        if (dFrom < dToday) return res.status(400).json({ error: 'Cannot apply for past dates' });
        if (to < from) return res.status(400).json({ error: 'End date must be after start date' });

        const totalDays = getLeaveDaysCount(from, to);
        if (totalDays > 30) return res.status(400).json({ error: 'Leave duration cannot exceed 30 days' });

        const maxDate = new Date(TodayIST);
        maxDate.setDate(maxDate.getDate() + 30);
        if (new Date(to) > maxDate) return res.status(400).json({ error: 'Cannot apply more than 30 days in advance' });


        // STRICT BALANCE CHECK
        const daysCount = getLeaveDaysCount(from, to);
        // Use new schema: employees/{uid}/leaveBalance
        const balSnap = await db.ref(`employees/${employeeId}/leaveBalance`).once('value');
        const balance = balSnap.val() || { pl: 17, co: 0 };

        if (type === 'PL') {
            if (balance.pl < daysCount) {
                return res.status(400).json({ error: `Insufficient PL Balance. Available: ${balance.pl}, Required: ${daysCount}` });
            }
        } else if (type === 'CO') {
            if (balance.co < daysCount) {
                return res.status(400).json({ error: `Insufficient Comp Off Balance. Available: ${balance.co}, Required: ${daysCount}` });
            }
        } else if (type === 'National Holiday') {
            return res.status(400).json({ error: 'Cannot apply for National Holiday manually.' });
        }

        // DUPLICATE/OVERLAP CHECK
        const conflict = await checkLeaveOverlap(employeeId, from, to);
        if (conflict) {
            if (conflict.status === 'approved') {
                return res.status(409).json({ error: 'Request Failed: You already have an approved leave for these dates.' });
            }
            return res.status(409).json({ error: 'Request Failed: You already have a pending request for these dates.' });
        }

        const isAttendanceOverlap = await checkAttendanceOverlap(employeeId, from, to);
        if (isAttendanceOverlap) {
            const leaveRef = db.ref(`leaves/${employeeId}`).push();
            const leaveId = leaveRef.key;
            // Auto-block logic
            const leaveData = {
                leaveId, employeeId, employeeName, type, from, to, totalDays, reason,
                status: 'auto-blocked',
                appliedAt: admin.database.ServerValue.TIMESTAMP,
                conflictNotes: 'Attendance already marked for these dates'
            };
            await leaveRef.set(leaveData);
            await logLeaveHistory(employeeId, 'auto-blocked', leaveData, 'system', 'system', { notes: 'Attendance conflict' });

            const usersSnap = await db.ref('employees').orderByChild('profile/role').equalTo('md').once('value');
            const mds = usersSnap.val() || {};
            const mdTokens = Object.values(mds).map(u => u.profile?.fcmToken).filter(Boolean);
            await sendPushNotification(mdTokens, '🚫 Leave Auto-Blocked', `${employeeName} attempted leave on marked attendance dates.`);

            return res.status(409).json({ error: 'Attendance already marked for selected dates', conflict: true });
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


        // Notify MD (using SSOT /employees path)
        try {
            const usersSnap = await db.ref('employees').orderByChild('profile/role').equalTo('md').once('value');
            const mds = usersSnap.val() || {};
            const mdTokens = Object.values(mds).map(u => u.profile?.fcmToken || u.profile?.fcm_token).filter(Boolean); // Support both casing keys if exists

            if (mdTokens.length > 0) {
                await sendPushNotification(mdTokens, '📝 New Leave Request', `${employeeName} applied for ${type} (${totalDays} days)`, {
                    type: 'LEAVE_REQUEST', leaveId
                });
            }
        } catch (notifError) {
            console.warn('[Leave] Notification failed but Leave applied:', notifError);
            // Swallowing error to prevent API failure
        }

        res.status(201).json({ success: true, leaveId });

    } catch (error) {
        console.error('Leave Apply Error:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    } finally {
        // RELEASE LOCK
        await lock.release();
    }
};

const getHistory = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const snapshot = await db.ref(`leaves/${employeeId}`).once('value');
        const leaves = snapshot.val() || {};
        res.json(Object.values(leaves));
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
};

const getPending = async (req, res) => {
    try {
        const snapshot = await db.ref('leaves').once('value');
        const allLeaves = [];
        const data = snapshot.val() || {};

        Object.values(data).forEach(empLeaves => {
            Object.values(empLeaves).forEach(leave => {
                if (leave.status === 'pending') {
                    allLeaves.push(leave);
                }
            });
        });

        res.json(allLeaves);
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
};

const approveLeave = async (req, res) => {
    const { leaveId, employeeId, mdId, mdName } = req.body;
    // SECURITY: Use requester's UID from token
    const requesterUid = req.user.uid;

    try {
        // 🔒 SECURITY: ZOMBIE ADMIN CHECK (Fix Failure Mode #6)
        const roleSnap = await db.ref(`employees/${requesterUid}/profile/role`).once('value');
        const realRole = (roleSnap.val() || '').toLowerCase();

        if (!['md', 'admin', 'owner'].includes(realRole)) {
            console.warn(`[Security] Zombie Admin blocked: ${requesterUid} attempted leave approval.`);
            return res.status(403).json({ error: 'Access Denied: Your role has been revoked.' });
        }

        const leaveRef = db.ref(`leaves/${employeeId}/${leaveId}`);

        // 1. LOCKING PHASE: Prevent Race Conditions (Double Deduction)
        // Transition 'pending' -> 'processing' atomically
        const transactionResult = await leaveRef.child('status').transaction((currentStatus) => {
            if (currentStatus === 'pending') {
                return 'processing';
            }
            return undefined; // Abort if not pending (already approved/rejected/processing)
        });

        if (!transactionResult.committed) {
            console.warn(`[Leave] Race Condition/Duplicate Approval Blocked for ${leaveId}`);
            return res.status(409).json({ error: 'Leave request is already being processed or finalized.' });
        }

        const snapshot = await leaveRef.once('value');
        const leave = snapshot.val();
        // leave.status is 'processing' now

        // 2. DEDUCTION PHASE
        const balanceRef = db.ref(`employees/${employeeId}/leaveBalance`);
        let insufficientFunds = false;

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
            insufficientFunds = true;
            console.warn(`[Leave] Insufficient funds for ${leaveId}, reverting lock.`);

            // REVERT LOCK
            await leaveRef.update({ status: 'pending', lockedBy: null });

            return res.status(400).json({ error: 'Insufficient balance to approve leave.' });
        }

        // 3. FINALIZATION PHASE
        // If we are here, balance is successfully deducted.
        await leaveRef.update({
            status: 'approved',
            actedAt: admin.database.ServerValue.TIMESTAMP,
            actorId: mdId,
            actorRole: 'MD'
        });

        await logLeaveHistory(employeeId, 'approved', leave, mdId, 'MD');

        // 4. NOTIFICATION (Non-Blocking)
        try {
            const userSnap = await db.ref(`employees/${employeeId}/profile`).once('value');
            const user = userSnap.val();
            if (user && user.fcmToken) {
                await sendPushNotification([user.fcmToken], '✅ Leave Approved', `Your ${leave.type} request has been approved.`);
            }
        } catch (nErr) {
            console.warn('[Leave] Approval Notification failed:', nErr);
        }

        // 5. ATTENDANCE OVERRIDES (Best Effort)
        try {
            const attSnap = await db.ref(`employees/${employeeId}/attendance`).once('value');
            const attData = attSnap.val();
            if (attData) {
                const leaveStart = new Date(leave.from);
                const leaveEnd = new Date(leave.to);
                leaveStart.setHours(0, 0, 0, 0);
                leaveEnd.setHours(0, 0, 0, 0);

                const updates = {};
                Object.entries(attData).forEach(([dateStr, record]) => {
                    // Check if dateStr matches
                    if (!dateStr) return;
                    const recDate = new Date(dateStr);
                    recDate.setHours(0, 0, 0, 0);

                    if (recDate >= leaveStart && recDate <= leaveEnd) {
                        updates[`employees/${employeeId}/attendance/${dateStr}/status`] = 'leave_override';
                        updates[`employees/${employeeId}/attendance/${dateStr}/mdReason`] = `Overridden by approved leave`;
                    }
                });

                if (Object.keys(updates).length > 0) {
                    await db.ref().update(updates);
                }
            }
        } catch (attErr) {
            console.error('[Leave] Attendance Override Failed:', attErr);
        }

        res.json({ success: true, message: 'Leave approved and attendance overrides applied.' });

    } catch (error) {
        console.error('[Leave Approval] Error:', error);
        // If we crashed after deduction but before finalization, it is stuck in 'processing'.
        // Admin intervention required for that edge case, but balance is safe.
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
};

const rejectLeave = async (req, res) => {
    const { leaveId, employeeId, mdId, mdName, reason } = req.body;
    const requesterUid = req.user.uid;

    try {
        // 🔒 SECURITY: ZOMBIE ADMIN CHECK
        const roleSnap = await db.ref(`employees/${requesterUid}/profile/role`).once('value');
        const realRole = (roleSnap.val() || '').toLowerCase();

        if (!['md', 'admin', 'owner'].includes(realRole)) {
            return res.status(403).json({ error: 'Access Denied: Your role has been revoked.' });
        }

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

        // Use new schema: employees/{uid}/profile
        const userSnap = await db.ref(`employees/${employeeId}/profile`).once('value');
        const user = userSnap.val();
        if (user && user.fcmToken) {
            await sendPushNotification([user.fcmToken], '❌ Leave Rejected', `Your leave request was rejected.`);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
};

const cancelLeave = async (req, res) => {
    // SECURITY: Use authenticated user's UID (IDOR prevention)
    const employeeId = req.user.uid;
    const { leaveId, reason } = req.body;
    try {
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

        const usersSnap = await db.ref('employees').orderByChild('profile/role').equalTo('md').once('value');
        const mds = usersSnap.val() || {};
        const mdTokens = Object.values(mds).map(u => u.profile?.fcmToken).filter(Boolean);
        await sendPushNotification(mdTokens, '🚫 Leave Cancelled', `${leave.employeeName} cancelled their request.`);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
};

module.exports = {
    applyLeave,
    getHistory,
    approveLeave,
    rejectLeave,
    cancelLeave
};
