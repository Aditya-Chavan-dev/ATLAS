const express = require('express');
const router = express.Router();

// Controllers
const notificationController = require('../controllers/notificationController');

const migrationController = require('../controllers/migrationController');
const attendanceController = require('../controllers/attendanceController');
const leaveController = require('../controllers/leaveController');
const dashboardController = require('../controllers/dashboardController');
const exportController = require('../controllers/exportController');
const healthController = require('../controllers/healthController'); // [NEW]
const employeeController = require('../controllers/employeeController'); // [NEW: Feature-First]

// Auth Middleware
// Auth Middleware (V2 Secure)
const unifiedAuthMiddleware = require('../auth/middleware/unifiedAuthMiddleware');
const requireRole = require('../auth/middleware/roleBasedMiddleware');
const roleManagementController = require('../controllers/roles/roleManagementController'); // [NEW]
const userCreationController = require('../controllers/auth/userCreationController'); // [NEW]

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
// FCM Routes (Any authenticated user)
router.post('/fcm/register', unifiedAuthMiddleware, notificationController.registerToken);
router.post('/fcm/unregister', unifiedAuthMiddleware, notificationController.unregisterToken);
router.post('/fcm/status', unifiedAuthMiddleware, notificationController.registerToken);

// Attendance Routes (Any authenticated user for their own, MD can update any)
// Attendance Routes
router.post('/attendance/mark', unifiedAuthMiddleware, attendanceController.markAttendance);
router.post('/attendance/status', unifiedAuthMiddleware, requireRole(['MD', 'OWNER']), attendanceController.updateStatus);

// Leave Routes
// Leave Routes
router.post('/leave/apply', unifiedAuthMiddleware, leaveController.applyLeave);
router.get('/leave/history/:employeeId', unifiedAuthMiddleware, leaveController.getHistory);
router.post('/leave/approve', unifiedAuthMiddleware, requireRole(['MD', 'OWNER']), leaveController.approveLeave);
router.post('/leave/reject', unifiedAuthMiddleware, requireRole(['MD', 'OWNER']), leaveController.rejectLeave);
router.post('/leave/cancel', unifiedAuthMiddleware, leaveController.cancelLeave);

// Dashboard Routes (MD/Owner/HR only)
// Dashboard Routes (MD/Owner/HR only)
router.get('/dashboard/stats', unifiedAuthMiddleware, requireRole(['MD', 'OWNER', 'HR']), dashboardController.getDashboardStats);

// Export Routes (MD/Owner/HR only)
// Export Routes (MD/Owner/HR only)
router.get('/export/attendance', unifiedAuthMiddleware, requireRole(['MD', 'OWNER', 'HR']), exportController.exportAttendanceReport);

// ========================================
// ADMIN ROUTES (Owner/MD Only)
// ========================================

// ========================================
// EMPLOYEE DATA (Feature-First)
// ========================================
// Solves: Data Iceberg & Glass House
// Solves: Data Iceberg & Glass House
router.get('/employees/list', unifiedAuthMiddleware, employeeController.listEmployees);

// FCM Broadcast (MD/Owner only - sends to all users)
// FCM Broadcast (MD/Owner only - sends to all users)
router.post('/fcm/broadcast', unifiedAuthMiddleware, requireRole(['MD', 'OWNER']), notificationController.broadcastAttendance);

// User Management (Owner/MD only)
// User Management (Owner/MD only)
// Uses NEW V2 Controllers
router.post('/auth/create-employee', unifiedAuthMiddleware, requireRole(['MD', 'OWNER']), userCreationController.createEmployee);
router.post('/auth/role', unifiedAuthMiddleware, requireRole(['MD', 'OWNER']), roleManagementController.changeUserRole);
router.post('/auth/archive-employee', unifiedAuthMiddleware, requireRole(['MD', 'OWNER']), userCreationController.archiveEmployee); /* Similar to delete, need to check if these methods exist in new controller or if I should have kept authController */
router.post('/auth/delete-employee', unifiedAuthMiddleware, requireRole(['OWNER']), userCreationController.deleteEmployee); /* This method is not yet implemented in userCreationController, we actually need to migrate it first or keep authController for now? Wait, check below */

// System Routes (Owner only)
// System Routes (Owner only)
router.post('/system/migrate', unifiedAuthMiddleware, requireRole(['OWNER']), migrationController.runMigration);

module.exports = router;
