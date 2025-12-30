const express = require('express');
const router = express.Router();

// Controllers
const notificationController = require('../controllers/notificationController');
const authController = require('../controllers/authController');
const migrationController = require('../controllers/migrationController');
const attendanceController = require('../controllers/attendanceController');
const leaveController = require('../controllers/leaveController');
const dashboardController = require('../controllers/dashboardController');
const exportController = require('../controllers/exportController');
const healthController = require('../controllers/healthController'); // [NEW]

// Auth Middleware
const { verifyToken, verifyTokenAndRole } = require('../middleware/authMiddleware');

// Health Check (Deep)
router.get('/health', healthController.checkHealth);

// Metadata (Public)
router.get('/', (req, res) => {
    res.json({
        status: 'active',
        service: 'ATLAS Notification Server',
        timestamp: new Date().toISOString(),
        version: '3.3.0 (Health Verified)'
    });
});

// ========================================
// PROTECTED ROUTES (Require Login)
// ========================================

// FCM Routes (Any authenticated user)
router.post('/fcm/register', verifyToken, notificationController.registerToken);
router.post('/fcm/unregister', verifyToken, notificationController.unregisterToken);
router.post('/fcm/status', verifyToken, notificationController.registerToken);

// Attendance Routes (Any authenticated user for their own, MD can update any)
router.post('/attendance/mark', verifyToken, attendanceController.markAttendance);
router.post('/attendance/status', verifyTokenAndRole(['md', 'owner']), attendanceController.updateStatus);

// Leave Routes
router.post('/leave/apply', verifyToken, leaveController.applyLeave);
router.get('/leave/history/:employeeId', verifyToken, leaveController.getHistory);
router.post('/leave/approve', verifyTokenAndRole(['md', 'owner']), leaveController.approveLeave);
router.post('/leave/reject', verifyTokenAndRole(['md', 'owner']), leaveController.rejectLeave);
router.post('/leave/cancel', verifyToken, leaveController.cancelLeave);

// Dashboard Routes (MD/Owner/HR only)
router.get('/dashboard/stats', verifyTokenAndRole(['md', 'owner', 'hr']), dashboardController.getDashboardStats);

// Export Routes (MD/Owner/HR only)
router.get('/export/attendance', verifyTokenAndRole(['md', 'owner', 'hr']), exportController.exportAttendanceReport);

// ========================================
// ADMIN ROUTES (Owner/MD Only)
// ========================================

// FCM Broadcast (MD/Owner only - sends to all users)
router.post('/fcm/broadcast', verifyTokenAndRole(['md', 'owner']), notificationController.broadcastAttendance);

// User Management (Owner/MD only)
router.post('/auth/create-employee', verifyTokenAndRole(['md', 'owner']), authController.createEmployee);
router.post('/auth/archive-employee', verifyTokenAndRole(['md', 'owner']), authController.archiveEmployee);
router.post('/auth/delete-employee', verifyTokenAndRole(['owner']), authController.deleteEmployee);

// System Routes (Owner only)
router.post('/system/migrate', verifyTokenAndRole(['owner']), migrationController.runMigration);

module.exports = router;
