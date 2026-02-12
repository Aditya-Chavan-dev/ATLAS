const { db } = require('../config/firebase');
const catchAsync = require('../utils/asyncHandler'); // ✅ Added catchAsync

/**
 * STRICT METRICS COMPUTATION
 * Spec Section: Core Attendance Logic — Canonical Definition
 */
exports.getDashboardStats = catchAsync(async (req, res) => {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Fetch Source of Truth (All Employees - SSOT)
    // Was 'users', fixed to 'employees' to match write path
    const employeesSnap = await db.ref('employees').once('value');
    const employees = employeesSnap.val() || {};

    let totalEmployees = 0;
    let markedToday = 0;
    let approvedToday = 0; // "Present Today"
    let onSite = 0;
    let onLeave = 0;

    // 2. Iterate and Filter
    Object.values(employees).forEach(emp => {
        // Handle nested profile structure (created by userCreationController)
        const profile = emp.profile || {};
        const attendance = emp.attendance || {};

        // Filter: Active Employees Only
        const role = (profile.role || '').toLowerCase();
        const status = (profile.status || 'active').toLowerCase();

        // Exclude Admins/MDs/Owner from stats?
        // Logic says: if role is md/owner/admin, return.
        if (['md', 'owner', 'admin'].includes(role)) return;

        // Exclude Inactive/Archived
        if (status === 'archived' || profile.active === false) return;

        totalEmployees++;

        // 3. Check Attendance for Today
        if (attendance[todayStr]) {
            const record = attendance[todayStr];

            // "Marked" = Any record exists for today
            markedToday++;

            // "Approved/Present" = Status is 'Present' (Final Approved State) OR 'approved'
            const statusLower = (record.status || '').toLowerCase();
            if (statusLower === 'present' || statusLower === 'approved') {
                approvedToday++;
            }

            // "On Site" logic (Marked and LocationType = Site)
            if (record.locationType === 'Site') {
                onSite++;
            }

            // "On Leave" logic (Status explicitly indicates absence)
            if (['leave', 'absent', 'leave_override'].includes(statusLower)) {
                onLeave++;
            }
        }
    });

    // 4. Final Derived Metric
    const presentToday = approvedToday;

    // 5. Return Deterministic Result
    res.json({
        success: true,
        data: {
            totalEmployees, // N
            markedToday,    // Submitted
            approvedToday,  // Verified
            presentToday,   // FINAL METRIC (Same as approved)
            onSite,
            onLeave,
            date: todayStr
        }
    });
});

exports.getPendingRequests = catchAsync(async (req, res) => {
    // Should be implemented if routed in api.js
    // api.js: router.get('/dashboard/pending', ... dashboardController.getPendingRequests);
    // This was missing in the previous file view but is required by api.js

    // Fetch pending leaves
    const leavesSnap = await db.ref('leaves').once('value');
    const leavesData = leavesSnap.val() || {};
    const pendingLeaves = [];

    Object.values(leavesData).forEach(empLeaves => {
        Object.values(empLeaves).forEach(leave => {
            if (leave.status === 'pending') {
                pendingLeaves.push(leave);
            }
        });
    });

    // Fetch pending attendance (from Inbox Pattern)
    // We write to `pending_admin_inbox/attendance/{date}/{uid}`
    // But we need ALL pending, maybe across dates?
    // Usually admin checks for specific date or today?
    // Let's assume we fetch `pending_admin_inbox/attendance`
    const attendanceSnap = await db.ref('pending_admin_inbox/attendance').once('value');
    const attendanceData = attendanceSnap.val() || {};
    const pendingAttendance = [];

    // Flatten: Date -> UID -> Request
    Object.keys(attendanceData).forEach(date => {
        const requests = attendanceData[date];
        Object.values(requests).forEach(req => {
            if (req.actionRequired) {
                pendingAttendance.push({ ...req, date });
            }
        });
    });

    res.json({
        success: true,
        leaves: pendingLeaves,
        attendance: pendingAttendance
    });
});
