const { database } = require('../firebase/admin');
const { ROLES } = require('../config/roleConfig');
const catchAsync = require('../utils/asyncHandler'); // ✅ Added catchAsync

/**
 * @desc Get lightweight list of employees (Solves "Data Iceberg")
 * @route GET /api/employees/list
 * @access Private (Auth Required)
 */
exports.listEmployees = catchAsync(async (req, res) => {
    const employeesRef = database.ref('employees');
    const snapshot = await employeesRef.once('value');
    const data = snapshot.val() || {};

    // THE REMEDY: Map Raw Data -> Lightweight DTO
    // We only pick what the UI needs. We drop everything else.
    const safeList = Object.keys(data).map(uid => {
        const user = data[uid];
        const profile = user.profile || {};

        return {
            // 1. Identity (Essential Only)
            uid: uid,
            name: profile.name || 'Unknown',
            email: profile.email || '',
            photoURL: profile.photoURL || '',

            // 2. Role & Access
            role: profile.role || 'employee',
            status: profile.status || 'active', // active, suspended, archived

            // 3. Operational Metadata (No history, no logs)
            department: profile.department || '',
            designation: profile.designation || '',
            phone: profile.phone || '',
            joinedAt: profile.joinedAt || null
        };
    });

    // Optional: Filter out archived/deleted if not requested
    const activeList = safeList.filter(u => u.status !== 'archived');

    res.status(200).json({
        success: true,
        count: activeList.length,
        data: activeList
    });
});
