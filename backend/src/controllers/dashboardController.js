const { db } = require('../config/firebase');

/**
 * STRICT METRICS COMPUTATION
 * Spec Section: Core Attendance Logic — Canonical Definition
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Fetch Source of Truth (All Users)
        const usersSnap = await db.ref('users').once('value');
        const users = usersSnap.val() || {};

        let totalEmployees = 0;
        let markedToday = 0;
        let approvedToday = 0; // "Present Today"
        let onSite = 0;
        let onLeave = 0;

        // 2. Iterate and Filter
        Object.values(users).forEach(user => {
            // Filter: Active Employees Only
            const role = (user.role || '').toLowerCase();
            if (role === 'md' || role === 'owner' || role === 'admin') return;
            if (user.isActive === false || user.status === 'archived') return;

            totalEmployees++;

            // 3. Check Attendance for Today
            if (user.attendance && user.attendance[todayStr]) {
                const record = user.attendance[todayStr];

                // "Marked" = Any record exists for today
                markedToday++;

                // "Approved/Present" = Status is 'Present' (Final Approved State) OR 'approved'
                if (record.status === 'Present' || record.status === 'approved') {
                    approvedToday++;
                }

                // "On Site" logic (Marked and LocationType = Site)
                if (record.locationType === 'Site') {
                    onSite++;
                }

                // "On Leave" logic (Status explicitly indicates absence)
                if (record.status === 'Leave' || record.status === 'Absent' || record.status === 'leave_override') {
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

    } catch (error) {
        console.error('[Stats] Error computing dashboard stats:', error);
        res.status(500).json({ error: 'Failed to compute metrics' });
    }
};
