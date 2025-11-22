const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance (Clock In)
 * @access  Private (Employee)
 */
router.post('/mark', verifyToken, attendanceController.markAttendance);

/**
 * @route   PUT /api/attendance/edit/:attendanceId
 * @desc    Edit attendance details
 * @access  Private (Employee)
 */
router.put('/edit/:attendanceId', verifyToken, attendanceController.editAttendance);

/**
 * @route   GET /api/attendance/today
 * @desc    Get today's attendance for an employee
 * @access  Private
 */
router.get('/today', verifyToken, attendanceController.getTodayAttendance);

/**
 * @route   GET /api/attendance/my
 * @desc    Get my attendance history
 * @access  Private
 */
router.get('/my', verifyToken, attendanceController.getMyAttendance);

/**
 * @route   GET /api/attendance/pending
 * @desc    Get pending approvals
 * @access  Private (Manager)
 */
router.get('/pending', verifyToken, attendanceController.getPendingApprovals);

/**
 * @route   PUT /api/attendance/approve/:attendanceId
 * @desc    Approve attendance
 * @access  Private (Manager)
 */
router.put('/approve/:attendanceId', verifyToken, attendanceController.approveAttendance);

/**
 * @route   PUT /api/attendance/reject/:attendanceId
 * @desc    Reject attendance
 * @access  Private (Manager)
 */
router.put('/reject/:attendanceId', verifyToken, attendanceController.rejectAttendance);

module.exports = router;
