const { admin, db } = require('../config/firebaseConfig');

/**
 * Firebase doesn't allow undefined values - convert them to null
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
const sanitizeForFirebase = (obj) => {
    const sanitized = {};
    for (const key in obj) {
        sanitized[key] = obj[key] === undefined ? null : obj[key];
    }
    return sanitized;
};

/**
 * @desc    Mark Attendance (Clock In)
 * @route   POST /api/attendance/mark
 * @access  Private (Employee)
 * @body    { employeeId, type, siteName }
 */
exports.markAttendance = async (req, res) => {
    try {
        const { employeeId, type, siteName } = req.body;

        // 1. Validate Input
        if (!employeeId || !type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: employeeId and type are mandatory.'
            });
        }

        if (type !== 'Office' && type !== 'Site') {
            return res.status(400).json({
                success: false,
                message: 'Invalid attendance type. Must be "Office" or "Site".'
            });
        }

        if (type === 'Site' && !siteName) {
            return res.status(400).json({
                success: false,
                message: 'Site name is required when marking attendance from a site.'
            });
        }

        // 2. Get Current Date and Time
        const now = new Date();
        const timestamp = now.getTime();
        const date = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD

        // 3. Check for Duplicate Entry or Allow Re-marking if Rejected
        const todayAttendanceRef = db.ref(`employee_attendance/${employeeId}/${date}`);
        const todaySnapshot = await todayAttendanceRef.once('value');

        if (todaySnapshot.exists()) {
            // Get the existing attendance record
            const existingAttendanceId = todaySnapshot.val();
            const existingAttendanceRef = db.ref(`attendance/${existingAttendanceId}`);
            const existingAttendanceSnapshot = await existingAttendanceRef.once('value');
            const existingAttendance = existingAttendanceSnapshot.val();

            // If status is Rejected, allow re-marking by deleting old record
            if (existingAttendance && existingAttendance.status === 'Rejected') {
                console.log(`[Attendance] Deleting rejected attendance ${existingAttendanceId} to allow re-marking`);

                // Delete the old rejected attendance record
                const deleteUpdates = {};
                deleteUpdates[`attendance/${existingAttendanceId}`] = null;
                deleteUpdates[`employee_attendance/${employeeId}/${date}`] = null;
                // Note: rejected records are not in pending_approvals

                await db.ref().update(deleteUpdates);
            } else {
                // If status is not Rejected (Pending or Approved), don't allow duplicate
                return res.status(400).json({
                    success: false,
                    message: `Attendance has already been marked for today and is ${existingAttendance?.status || 'in processing'}.`
                });
            }
        }

        // 4. Fetch Employee Details
        // We need the name and email to store with the attendance record for easier display
        const employeeRef = db.ref(`employees/${employeeId}`);
        const employeeSnapshot = await employeeRef.once('value');
        const employeeData = employeeSnapshot.val();

        if (!employeeData) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found.'
            });
        }

        // 5. Create Attendance Record
        const attendanceId = `att_${timestamp}_${employeeId}`;

        const attendanceData = {
            employeeId,
            employeeName: employeeData.name || 'Unknown',
            employeeEmail: employeeData.email || 'No Email',
            type,
            siteName: type === 'Site' ? siteName : null,
            status: 'Pending', // Default status is Pending until approved by Manager
            markedAt: now.toISOString(),
            date,
            isEdited: false,
            originalData: null,
            editedAt: null,
            approvedBy: null,
            approvedAt: null,
            rejectedBy: null,
            rejectedAt: null
        };

        // 6. Atomic Update
        // We update multiple nodes simultaneously to ensure data consistency
        const updates = {};
        updates[`attendance/${attendanceId}`] = sanitizeForFirebase(attendanceData); // Main record
        updates[`employee_attendance/${employeeId}/${date}`] = attendanceId; // Index for quick lookup by employee/date
        updates[`pending_approvals/${attendanceId}`] = true; // Index for Manager's approval list

        await db.ref().update(updates);

        // 7. Send Success Response
        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully. Waiting for Manager approval.',
            data: {
                attendanceId,
                status: 'Pending',
                type,
                siteName: attendanceData.siteName,
                markedAt: attendanceData.markedAt
            }
        });

    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error. Failed to mark attendance.',
            error: error.message
        });
    }
};

/**
 * @desc    Edit Attendance
 * @route   PUT /api/attendance/edit/:attendanceId
 * @access  Private (Employee)
 * @body    { type, siteName }
 */
exports.editAttendance = async (req, res) => {
    try {
        const { attendanceId } = req.params;
        const { type, siteName } = req.body;

        // Validate Input
        if (!type) {
            return res.status(400).json({ success: false, message: 'Type is required.' });
        }

        if (type === 'Site' && !siteName) {
            return res.status(400).json({ success: false, message: 'Site name is required for Site attendance.' });
        }

        // Fetch existing record
        const attendanceRef = db.ref(`attendance/${attendanceId}`);
        const snapshot = await attendanceRef.once('value');
        const attendanceData = snapshot.val();

        if (!attendanceData) {
            return res.status(404).json({ success: false, message: 'Attendance record not found.' });
        }

        // Allow edit only if status is Pending
        if (attendanceData.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot edit attendance. Status is already ${attendanceData.status}.`
            });
        }

        // Preserve original data for audit trail
        const originalData = attendanceData.isEdited
            ? attendanceData.originalData
            : sanitizeForFirebase({
                type: attendanceData.type,
                siteName: attendanceData.siteName,
                markedAt: attendanceData.markedAt
            });

        // Update record
        const updates = {
            type,
            siteName: type === 'Site' ? siteName : null,
            isEdited: true,
            originalData,
            editedAt: new Date().toISOString()
        };

        await attendanceRef.update(sanitizeForFirebase(updates));

        res.status(200).json({
            success: true,
            message: 'Attendance updated successfully.',
            data: updates
        });

    } catch (error) {
        console.error('Error editing attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to edit attendance.',
            error: error.message
        });
    }
};

/**
 * @desc    Get Today's Attendance for an Employee
 * @route   GET /api/attendance/today
 * @access  Private
 */
exports.getTodayAttendance = async (req, res) => {
    try {
        const { employeeId } = req.query;

        if (!employeeId) {
            return res.status(400).json({ success: false, message: 'Employee ID is required.' });
        }

        const today = new Date().toISOString().split('T')[0];
        const todayAttendanceRef = db.ref(`employee_attendance/${employeeId}/${today}`);
        const snapshot = await todayAttendanceRef.once('value');

        if (!snapshot.exists()) {
            return res.status(200).json({
                success: true,
                data: null,
                message: 'No attendance marked for today.'
            });
        }

        const attendanceId = snapshot.val();
        const attendanceRef = db.ref(`attendance/${attendanceId}`);
        const attendanceSnapshot = await attendanceRef.once('value');

        res.status(200).json({
            success: true,
            data: {
                attendanceId,
                ...attendanceSnapshot.val()
            }
        });

    } catch (error) {
        console.error('Error fetching today\'s attendance:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch attendance.', error: error.message });
    }
};

/**
 * @desc    Get Attendance History
 * @route   GET /api/attendance/my
 * @access  Private
 */
exports.getMyAttendance = async (req, res) => {
    try {
        const { employeeId, startDate, endDate } = req.query;

        if (!employeeId) {
            return res.status(400).json({ success: false, message: 'Employee ID is required.' });
        }

        const employeeAttendanceRef = db.ref(`employee_attendance/${employeeId}`);
        const snapshot = await employeeAttendanceRef.once('value');
        const dates = snapshot.val() || {};

        // Fetch details for each date
        const attendancePromises = Object.entries(dates).map(async ([date, attendanceId]) => {
            if (startDate && date < startDate) return null;
            if (endDate && date > endDate) return null;

            const attendanceRef = db.ref(`attendance/${attendanceId}`);
            const attendanceSnapshot = await attendanceRef.once('value');
            return {
                attendanceId,
                ...attendanceSnapshot.val()
            };
        });

        const attendanceRecords = (await Promise.all(attendancePromises))
            .filter(record => record !== null)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            success: true,
            data: attendanceRecords
        });

    } catch (error) {
        console.error('Error fetching attendance history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch history.', error: error.message });
    }
};

/**
 * @desc    Get Pending Approvals (For Manager)
 * @route   GET /api/attendance/pending
 * @access  Private (Manager)
 */
exports.getPendingApprovals = async (req, res) => {
    try {
        const pendingRef = db.ref('pending_approvals');
        const snapshot = await pendingRef.once('value');
        const pendingIds = snapshot.val() || {};

        const attendancePromises = Object.keys(pendingIds).map(async (attendanceId) => {
            const attendanceRef = db.ref(`attendance/${attendanceId}`);
            const attendanceSnapshot = await attendanceRef.once('value');
            return {
                attendanceId,
                ...attendanceSnapshot.val()
            };
        });

        const pendingRecords = (await Promise.all(attendancePromises))
            .sort((a, b) => new Date(a.markedAt) - new Date(b.markedAt));

        res.status(200).json({
            success: true,
            data: pendingRecords
        });

    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending approvals.', error: error.message });
    }
};

/**
 * @desc    Approve Attendance
 * @route   PUT /api/attendance/approve/:attendanceId
 * @access  Private (Manager)
 */
exports.approveAttendance = async (req, res) => {
    try {
        const { attendanceId } = req.params;
        const { approvedBy } = req.body;

        if (!approvedBy) {
            return res.status(400).json({ success: false, message: 'Approver ID is required.' });
        }

        const updates = {};
        updates[`attendance/${attendanceId}/status`] = 'Approved';
        updates[`attendance/${attendanceId}/approvedBy`] = approvedBy;
        updates[`attendance/${attendanceId}/approvedAt`] = new Date().toISOString();
        updates[`pending_approvals/${attendanceId}`] = null; // Remove from pending list

        await db.ref().update(updates);

        res.status(200).json({ success: true, message: 'Attendance approved successfully.' });

    } catch (error) {
        console.error('Error approving attendance:', error);
        res.status(500).json({ success: false, message: 'Failed to approve attendance.', error: error.message });
    }
};

/**
 * @desc    Reject Attendance
 * @route   PUT /api/attendance/reject/:attendanceId
 * @access  Private (Manager)
 */
exports.rejectAttendance = async (req, res) => {
    try {
        const { attendanceId } = req.params;
        const { rejectedBy } = req.body;

        if (!rejectedBy) {
            return res.status(400).json({ success: false, message: 'Rejector ID is required.' });
        }

        const updates = {};
        updates[`attendance/${attendanceId}/status`] = 'Rejected';
        updates[`attendance/${attendanceId}/rejectedBy`] = rejectedBy;
        updates[`attendance/${attendanceId}/rejectedAt`] = new Date().toISOString();
        updates[`pending_approvals/${attendanceId}`] = null; // Remove from pending list

        await db.ref().update(updates);

        res.status(200).json({ success: true, message: 'Attendance rejected successfully.' });

    } catch (error) {
        console.error('Error rejecting attendance:', error);
        res.status(500).json({ success: false, message: 'Failed to reject attendance.', error: error.message });
    }
};
