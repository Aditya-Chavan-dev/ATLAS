const express = require('express');
const router = express.Router();

// ──────────────────────────────────────────────────────────
// CONTROLLERS
// ──────────────────────────────────────────────────────────

const notificationController = require('../controllers/notificationController');
const migrationController = require('../controllers/migrationController');
const attendanceController = require('../controllers/attendanceController');
const leaveController = require('../controllers/leaveController');
const dashboardController = require('../controllers/dashboardController');
const exportController = require('../controllers/exportController');
const healthController = require('../controllers/healthController');
const employeeController = require('../controllers/employeeController');
const roleManagementController = require('../controllers/roles/roleManagementController');
const userCreationController = require('../controllers/auth/userCreationController');

// ──────────────────────────────────────────────────────────
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ──────────────────────────────────────────────────────────

const unifiedAuthMiddleware = require('../auth/middleware/unifiedAuthMiddleware');
const requireRole = require('../auth/middleware/roleBasedMiddleware');

// ──────────────────────────────────────────────────────────
// VALIDATION MIDDLEWARE (ZERO-TRUST FRAMEWORK)
// ──────────────────────────────────────────────────────────

const {
    validate,
    authorize,
    protectAgainstPrototypePollution,
    validationRateLimiter // ✅ Gap #5 fix
} = require('../middleware/validate');

const { schemas } = require('../validation/schemas');

// ──────────────────────────────────────────────────────────
// GLOBAL MIDDLEWARE (Applied to ALL routes)
// ──────────────────────────────────────────────────────────

// CRITICAL: Prototype pollution protection MUST run FIRST
router.use(protectAgainstPrototypePollution);

// SECOND: Rate limiting to prevent validation DoS (Gap #5 fix)
router.use(validationRateLimiter); // ✅ 100 req/15min per IP

// ══════════════════════════════════════════════════════════
// PUBLIC ROUTES (No Authentication Required)
// ══════════════════════════════════════════════════════════

// Health Check (Deep DB connectivity test)
router.get('/health', healthController.checkHealth);

// Metadata Endpoint
router.get('/', (req, res) => {
    res.json({
        status: 'active',
        service: 'ATLAS Backend API',
        timestamp: new Date().toISOString(),
        version: '4.0.0 (Zero-Trust Validation)',
        security: 'Maximum Hardening Enabled'
    });
});

// ══════════════════════════════════════════════════════════
// PROTECTED ROUTES (Authentication Required)
// ══════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────
// FCM NOTIFICATION ROUTES
// ──────────────────────────────────────────────────────────

// Register FCM token (any authenticated user)
router.post('/fcm/register',
    unifiedAuthMiddleware,
    notificationController.registerToken
);

// Unregister FCM token (any authenticated user)
router.post('/fcm/unregister',
    unifiedAuthMiddleware,
    notificationController.unregisterToken
);

// FCM status (any authenticated user)
router.post('/fcm/status',
    unifiedAuthMiddleware,
    notificationController.registerToken
);

// ──────────────────────────────────────────────────────────
// ATTENDANCE ROUTES (VALIDATION HARDENED)
// Fixes: C1, C11, C16
// ──────────────────────────────────────────────────────────

// Mark attendance (any authenticated user for themselves)
router.post('/attendance/mark',
    validate(schemas.markAttendance),          // ✅ Input validation + sanitization
    unifiedAuthMiddleware,                      // ✅ Authentication
    attendanceController.markAttendance
);

// Update attendance status (MD/Owner only)
router.post('/attendance/status',
    validate(schemas.updateAttendanceStatus),   // ✅ Input validation
    unifiedAuthMiddleware,                      // ✅ Authentication
    authorize({                                 // ✅ ZERO-TRUST Authorization
        allowRoles: ['MD', 'OWNER'],
        allowSelf: false
    }),
    attendanceController.updateStatus
);


// ──────────────────────────────────────────────────────────
// LEAVE ROUTES (VALIDATION + AUTHORIZATION HARDENED)
// Fixes: C1, C4 (IDOR), C11
// ──────────────────────────────────────────────────────────

// Apply for leave (any authenticated user)
router.post('/leave/apply',
    validate(schemas.applyLeave),              // ✅ Input validation + sanitization
    unifiedAuthMiddleware,                      // ✅ Authentication
    leaveController.applyLeave
);

// Get leave history (with IDOR protection)
router.get('/leave/history/:employeeId',
    validate(schemas.getLeaveHistory),          // ✅ UID validation
    unifiedAuthMiddleware,                      // ✅ Authentication
    authorize({                                 // ✅ CRITICAL: IDOR protection
        resourceParam: 'employeeId',
        allowRoles: ['MD', 'OWNER'],
        allowSelf: true
    }),
    leaveController.getHistory
);

// Approve/reject leave (MD/Owner only)
router.post('/leave/approve',
    validate(schemas.updateAttendanceStatus), // Reusing schema or needs new one depending on validation requirements
    unifiedAuthMiddleware,
    authorize({
        allowRoles: ['MD', 'OWNER'],
        allowSelf: false
    }),
    leaveController.approveLeave
);

// Reject leave (MD/Owner only)
router.post('/leave/reject',
    validate(schemas.updateAttendanceStatus),   // Reusing schema for consistency
    unifiedAuthMiddleware,
    authorize({
        allowRoles: ['MD', 'OWNER'],
        allowSelf: false
    }),
    leaveController.rejectLeave
);

// Reject leave route (if separate) or handled by approve? 
// Original code had approveLeave handling logic, but exportController had specific exports.
// Wait, looking at api.js, there is NO distinct reject route shown in view_file above!
// Ah, `leaveController.approveLeave` handles approval?
// Let's check `leaveController.js`. It has `exports.approveLeave` AND `exports.rejectLeave`.
// But `api.js` only showed `router.post('/leave/approve', ... leaveController.approveLeave )`.
// Where is `rejectLeave` routed?
// I must have missed it in `api.js` view?
// Let's re-read the `api.js` output above.
// Lines 137-142:
// router.post('/leave/approve', ... leaveController.approveLeave );
// It seems `api.js` might be missing the reject route? Or maybe `approveLeave` handles both?
// In `leaveController.js` I see `exports.rejectLeave`.
// If `api.js` implies `approveLeave` handles everything, that conflicts with controller having `rejectLeave`.
// I will check `api.js` again very carefully.


// Cancel leave (own leave only)
router.post('/leave/cancel',
    unifiedAuthMiddleware,
    leaveController.cancelLeave
);

// ──────────────────────────────────────────────────────────
// DASHBOARD ROUTES
// ──────────────────────────────────────────────────────────

// Get dashboard stats (MD/Owner only)
router.get('/dashboard/stats',
    unifiedAuthMiddleware,
    requireRole(['MD', 'OWNER']),
    dashboardController.getDashboardStats
);

// Get pending requests for MD (MD/Owner only)
router.get('/dashboard/pending',
    unifiedAuthMiddleware,
    requireRole(['MD', 'OWNER']),
    dashboardController.getPendingRequests
);

// ──────────────────────────────────────────────────────────
// EXPORT ROUTES (VALIDATION HARDENED)
// Fixes: H23, C16 (Excel injection in controller)
// ──────────────────────────────────────────────────────────

// Export attendance report (MD/Owner only)
router.get('/export',
    validate(schemas.exportAttendance),         // ✅ Month/year validation
    unifiedAuthMiddleware,                      // ✅ Authentication
    requireRole(['MD', 'OWNER']),              // ✅ Role authorization
    exportController.exportAttendanceReport     // ✅ Excel sanitization applied
);

// ──────────────────────────────────────────────────────────
// EMPLOYEE MANAGEMENT ROUTES (Owner only)
// ──────────────────────────────────────────────────────────

// List all employees (Owner only)
router.get('/employees',
    unifiedAuthMiddleware,
    requireRole(['OWNER']),
    employeeController.listEmployees
);

// Get employee details (Owner only)
router.get('/employees/:employeeId',
    unifiedAuthMiddleware,
    requireRole(['OWNER']),
    employeeController.getEmployeeDetails
);

// ──────────────────────────────────────────────────────────
// USER CREATION & ROLE MANAGEMENT (Owner only)
// ──────────────────────────────────────────────────────────

// Create new user (Owner only)
router.post('/users/create',
    unifiedAuthMiddleware,
    requireRole(['OWNER']),
    userCreationController.createEmployee
);

// Delete user (Owner only)
router.delete('/users/:uid',
    unifiedAuthMiddleware,
    requireRole(['OWNER']),
    userCreationController.deleteEmployee
);

// Update user role (Owner only)
router.post('/roles/update',
    unifiedAuthMiddleware,
    requireRole(['OWNER']),
    roleManagementController.updateRole
);

// List all users with roles (Owner only)
router.get('/roles/list',
    unifiedAuthMiddleware,
    requireRole(['OWNER']),
    roleManagementController.listUsersWithRoles
);

// ──────────────────────────────────────────────────────────
// SYSTEM ROUTES (Owner only)
// ──────────────────────────────────────────────────────────

// Migration endpoints (Owner only)
router.post('/migrate/addEmailsToProfiles',
    unifiedAuthMiddleware,
    requireRole(['OWNER']),
    migrationController.addEmailsToProfiles
);

router.post('/migrate/auditEmailSync',
    unifiedAuthMiddleware,
    requireRole(['OWNER']),
    migrationController.auditEmailSync
);

module.exports = router;

