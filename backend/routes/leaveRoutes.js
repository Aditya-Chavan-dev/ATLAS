const express = require('express');
const router = express.Router();
const { applyLeave, updateLeaveStatus, getLeaveRequests } = require('../controllers/leaveController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/leave/apply
 * @desc    Apply for leave
 * @access  Private (Employee)
 */
router.post('/apply', verifyToken, applyLeave);

/**
 * @route   PUT /api/leave/approve/:id
 * @desc    Approve or Reject leave request
 * @access  Private (Manager)
 */
router.put('/approve/:id', verifyToken, updateLeaveStatus);

/**
 * @route   GET /api/leave
 * @desc    Get all pending leave requests
 * @access  Private (Manager)
 */
router.get('/', verifyToken, getLeaveRequests);

module.exports = router;
