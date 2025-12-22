const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authController = require('../controllers/authController');

// Health Check
router.get('/', (req, res) => {
    res.json({
        status: 'active',
        service: 'ATLAS Notification Server',
        timestamp: new Date().toISOString(),
        version: '3.1.0 (Strict Broadcast)'
    });
});

// FCM Routes
router.post('/fcm/register', notificationController.registerToken);
router.post('/fcm/unregister', notificationController.unregisterToken);
// Map status updates (e.g. denied) to same handler or specific status handler if exists
router.post('/fcm/status', notificationController.registerToken); // Reusing register logic for status update
router.post('/fcm/broadcast', notificationController.broadcastAttendance);

// Attendance Routes (Transactional Notification)
const attendanceController = require('../controllers/attendanceController');
router.post('/attendance/mark', attendanceController.markAttendance);
router.post('/attendance/status', attendanceController.updateStatus);

// Leave Routes
const leaveController = require('../controllers/leaveController');
router.post('/leave/apply', leaveController.applyLeave);
router.get('/leave/history/:employeeId', leaveController.getHistory); // If used
router.post('/leave/approve', leaveController.approveLeave); // If used via API (MD app uses direct firebase write currently? No, strict mode implies API usage for standard notification/balance)
router.post('/leave/reject', leaveController.rejectLeave);
router.post('/leave/cancel', leaveController.cancelLeave);

// Dashboard Routes
const dashboardController = require('../controllers/dashboardController');
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// Auth Routes (Admin Only)
router.post('/auth/create-employee', authController.createEmployee);

module.exports = router;
