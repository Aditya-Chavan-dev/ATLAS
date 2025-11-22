const { db } = require('../config/firebaseConfig');

/**
 * @desc    Apply for Leave
 * @route   POST /api/leave/apply
 * @access  Private (Employee)
 * @body    { employeeId, startDate, endDate, reason, type }
 */
const applyLeave = async (req, res) => {
    try {
        const { employeeId, startDate, endDate, reason, type } = req.body;

        // Basic Validation
        if (!employeeId || !startDate || !endDate || !type) {
            return res.status(400).json({
                success: false,
                message: 'All fields (employeeId, startDate, endDate, type) are required.'
            });
        }

        const leaveRef = db.ref('leave_requests').push();

        await leaveRef.set({
            employeeId,
            startDate,
            endDate,
            reason: reason || '',
            type,
            status: 'Pending',
            appliedAt: new Date().toISOString()
        });

        // TODO: Implement Notification to Manager (FCM or Email)

        res.status(201).json({
            success: true,
            id: leaveRef.key,
            message: 'Leave application submitted successfully.'
        });

    } catch (error) {
        console.error('Error applying for leave:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to apply for leave.',
            error: error.message
        });
    }
};

/**
 * @desc    Update Leave Status (Approve/Reject)
 * @route   PUT /api/leave/:id/status
 * @access  Private (Manager)
 * @body    { status, approvedBy }
 */
const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approvedBy } = req.body; // status: 'Approved' | 'Rejected'

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "Approved" or "Rejected".'
            });
        }

        await db.ref(`leave_requests/${id}`).update({
            status,
            approvedBy,
            updatedAt: new Date().toISOString()
        });

        // Future Logic: If approved, deduct from employee's leave balance

        res.status(200).json({
            success: true,
            message: `Leave request ${status} successfully.`
        });

    } catch (error) {
        console.error('Error updating leave status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update leave status.',
            error: error.message
        });
    }
};

/**
 * @desc    Get All Pending Leave Requests
 * @route   GET /api/leave/pending
 * @access  Private (Manager)
 */
const getLeaveRequests = async (req, res) => {
    try {
        // Fetch only Pending requests
        const snapshot = await db.ref('leave_requests')
            .orderByChild('status')
            .equalTo('Pending')
            .once('value');

        const requests = snapshot.val();

        res.status(200).json({
            success: true,
            data: requests || {}
        });

    } catch (error) {
        console.error('Error fetching leave requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave requests.',
            error: error.message
        });
    }
};

module.exports = { applyLeave, updateLeaveStatus, getLeaveRequests };
