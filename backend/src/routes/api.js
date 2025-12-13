const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const notificationController = require('../controllers/notificationController');
const exportController = require('../controllers/exportController');

// Health Check
router.get('/', (req, res) => {
    res.json({
        status: 'active',
        service: 'ATLAS Notification Server',
        timestamp: new Date().toISOString(),
        version: '2.0.0 (Refactored)'
    });
});

// Leave Routes
router.post('/leave/apply', leaveController.applyLeave);
router.post('/leave/approve', leaveController.approveLeave);
router.post('/leave/reject', leaveController.rejectLeave);
router.post('/leave/cancel', leaveController.cancelLeave);
router.get('/leave/history/:employeeId', leaveController.getHistory);
router.get('/leave/pending', leaveController.getPending);

// Notification & Debug Routes
router.post('/trigger-reminder', notificationController.triggerReminder);
router.post('/send-test', notificationController.sendTestNotification);
router.get('/pending-employees', notificationController.getPendingEmployees);
router.post('/log-error', notificationController.logError);
router.post('/notifications/subscribe', notificationController.subscribeToBroadcast);
router.post('/notifications/unsubscribe', notificationController.unsubscribeFromBroadcast);

// Export Routes
router.get('/export-attendance-report', exportController.exportAttendanceReport);

module.exports = router;
