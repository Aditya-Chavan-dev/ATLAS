const { db } = require('../config/firebase');
const { getEmployeeStats } = require('../utils/employeeStats');

/**
 * Get Dashboard Statistics
 * SINGLE SOURCE OF TRUTH for employee counts and attendance stats
 * 
 * Replaces client-side calculation in employeeStats.js
 * Fixes LEAK #5 (SSOT violation) and LEAK #10 (UI-calculated metrics)
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // Get today's date in IST (YYYY-MM-DD format)
        const today = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
        const istDate = new Date(today.getTime() + istOffset);
        const todayISO = istDate.toISOString().split('T')[0];

        // Fetch all employees from database
        const employeesSnapshot = await db.ref('employees').once('value');
        const employeesData = employeesSnapshot.val() || {};

        // Use centralized employeeStats logic
        const stats = getEmployeeStats(employeesData, todayISO);

        // Return authoritative counts
        res.json({
            success: true,
            date: todayISO,
            stats: {
                totalEmployees: stats.stats.totalEmployees,
                present: stats.stats.present,
                absent: stats.stats.absent,
                onsite: stats.stats.onsite,
                onLeave: stats.stats.onLeave,
                pendingApprovals: 0, // TODO: Calculate pending approvals
            },
            employees: stats.validEmployees, // For dashboard display
            diagnostics: stats.diagnostics, // For debugging
        });

    } catch (error) {
        console.error('[Dashboard] Stats Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics'
        });
    }
};

module.exports = {
    getDashboardStats
};
