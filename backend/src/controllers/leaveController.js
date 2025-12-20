const { db } = require('../config/firebase');
const { sendPushNotification } = require('../services/notificationService');
const { getTodayDateIST, getLeaveDaysCount } = require('../utils/dateUtils');

const checkLeaveOverlap = async (employeeId, start, end) => {
    const snapshot = await db.ref(`leaves/${employeeId}`).once('value');
    const leaves = snapshot.val();
    if (!leaves) return null;

    const startD = new Date(start);
    const endD = new Date(end);
    startD.setHours(0, 0, 0, 0);
    endD.setHours(0, 0, 0, 0);

    return Object.values(leaves).find(leave => {
        if (['rejected', 'cancelled'].includes(leave.status)) return false;
        const lStart = new Date(leave.from);
        const lEnd = new Date(leave.to);
        lStart.setHours(0, 0, 0, 0);
        lEnd.setHours(0, 0, 0, 0);
        return startD <= lEnd && endD >= lStart;
    });
};

const checkAttendanceOverlap = async (employeeId, start, end) => {
    const snapshot = await db.ref('attendance').orderByChild('employeeId').equalTo(employeeId).once('value');
    const attendance = snapshot.val();
    if (!attendance) return false;

    const startD = new Date(start);
    const endD = new Date(end);
    startD.setHours(0, 0, 0, 0);
    endD.setHours(0, 0, 0, 0);

    return Object.values(attendance).some(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate >= startD && recordDate <= endD;
    });
};
// ... (keep logLeaveHistory as is)



const applyLeave = async (req, res) => {
    try {
        const { employeeId, employeeName, type, from, to, reason } = req.body;

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
        const balSnap = await db.ref(`users/${employeeId}/leaveBalance`).once('value');
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
                appliedAt: Date.now(),
                conflictNotes: 'Attendance already marked for these dates'
            };
            await leaveRef.set(leaveData);
            await logLeaveHistory(employeeId, 'auto-blocked', leaveData, 'system', 'system', { notes: 'Attendance conflict' });

            const usersSnap = await db.ref('users').orderByChild('role').equalTo('md').once('value');
            const mds = usersSnap.val() || {};
            const mdTokens = Object.values(mds).map(u => u.fcmToken);
            await sendPushNotification(mdTokens, '🚫 Leave Auto-Blocked', `${employeeName} attempted leave on marked attendance dates.`);

            return res.status(409).json({ error: 'Attendance already marked for selected dates', conflict: true });
        }

        // Apply
        const leaveRef = db.ref(`leaves/${employeeId}`).push();
        const leaveId = leaveRef.key;

        const leaveData = {
            leaveId, employeeId, employeeName, type, from, to, totalDays, reason,
            status: 'pending',
            appliedAt: Date.now()
        };

        await leaveRef.set(leaveData);
        await logLeaveHistory(employeeId, 'applied', leaveData, employeeId, 'employee');

        // Notify MD
        const usersSnap = await db.ref('users').orderByChild('role').equalTo('md').once('value');
        const mds = usersSnap.val() || {};
        const mdTokens = Object.values(mds).map(u => u.fcmToken);

        await sendPushNotification(mdTokens, '📝 New Leave Request', `${employeeName} applied for ${type} (${totalDays} days)`, {
            type: 'LEAVE_REQUEST', leaveId
        });

        res.status(201).json({ success: true, leaveId });

    } catch (error) {
        console.error('Leave Apply Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getHistory = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const snapshot = await db.ref(`leaves/${employeeId}`).once('value');
        const leaves = snapshot.val() || {};
        res.json(Object.values(leaves));
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
};

const approveLeave = async (req, res) => {
    const { leaveId, employeeId, mdId, mdName } = req.body;
    try {
        const leaveRef = db.ref(`leaves/${employeeId}/${leaveId}`);
        const snapshot = await leaveRef.once('value');
        const leave = snapshot.val();

        if (!leave || leave.status !== 'pending') return res.status(400).json({ error: 'Invalid leave request' });

        // STRICT BALANCE DEDUCTION
        const balanceRef = db.ref(`users/${employeeId}/leaveBalance`);


        // Simpler approach: Check then Deduct (Optimistic Locking via Transaction)
        // Re-implementing correctly:
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
            // Transaction aborted or threw error
            return res.status(400).json({ error: 'Insufficient balance for approval' });
        }

        await leaveRef.update({
            status: 'approved',
            actedAt: Date.now(),
            actorId: mdId,
            actorRole: 'MD'
        });

        await logLeaveHistory(employeeId, 'approved', leave, mdId, 'MD');

        const userSnap = await db.ref(`users/${employeeId}`).once('value');
        const user = userSnap.val();
        if (user && user.fcmToken) {
            await sendPushNotification([user.fcmToken], '✅ Leave Approved', `Your ${leave.type} request has been approved.`);
        }

        const attSnap = await db.ref('attendance').orderByChild('employeeId').equalTo(employeeId).once('value');
        const attData = attSnap.val();
        if (attData) {
            const leaveStart = new Date(leave.from);
            const leaveEnd = new Date(leave.to);
            leaveStart.setHours(0, 0, 0, 0);
            leaveEnd.setHours(0, 0, 0, 0);

            const updates = {};
            Object.entries(attData).forEach(([attId, record]) => {
                const recDate = new Date(record.date);
                recDate.setHours(0, 0, 0, 0);

                if (recDate >= leaveStart && recDate <= leaveEnd) {
                    updates[`attendance/${attId}/status`] = 'leave_override';
                    updates[`attendance/${attId}/mdReason`] = `Overridden by approved leave ${leaveId}`;
                }
            });

            if (Object.keys(updates).length > 0) {
                await db.ref().update(updates);
            }
        }

        res.json({ success: true, message: 'Leave approved and attendance overrides applied.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const rejectLeave = async (req, res) => {
    const { leaveId, employeeId, mdId, mdName, reason } = req.body;
    try {
        const leaveRef = db.ref(`leaves/${employeeId}/${leaveId}`);
        const snapshot = await leaveRef.once('value');
        const leave = snapshot.val();

        if (!leave || leave.status !== 'pending') return res.status(400).json({ error: 'Invalid leave request' });

        await leaveRef.update({
            status: 'rejected',
            actedAt: Date.now(),
            actorId: mdId,
            actorRole: 'MD',
            rejectionReason: reason
        });

        await logLeaveHistory(employeeId, 'rejected', leave, mdId, 'MD', { reason });

        const userSnap = await db.ref(`users/${employeeId}`).once('value');
        const user = userSnap.val();
        if (user && user.fcmToken) {
            await sendPushNotification([user.fcmToken], '❌ Leave Rejected', `Your leave request was rejected.`);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const cancelLeave = async (req, res) => {
    const { leaveId, employeeId, reason } = req.body;
    try {
        const leaveRef = db.ref(`leaves/${employeeId}/${leaveId}`);
        const snapshot = await leaveRef.once('value');
        const leave = snapshot.val();

        if (!leave || leave.status !== 'pending') return res.status(400).json({ error: 'Only pending leaves can be cancelled' });

        await leaveRef.update({
            status: 'cancelled',
            actedAt: Date.now(),
            actorId: employeeId,
            actorRole: 'employee'
        });

        await logLeaveHistory(employeeId, 'cancelled', leave, employeeId, 'employee', { reason });

        const usersSnap = await db.ref('users').orderByChild('role').equalTo('md').once('value');
        const mds = usersSnap.val() || {};
        const mdTokens = Object.values(mds).map(u => u.fcmToken);
        await sendPushNotification(mdTokens, '🚫 Leave Cancelled', `${leave.employeeName} cancelled their request.`);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    applyLeave,
    getHistory,
    approveLeave,
    rejectLeave,
    cancelLeave
};
