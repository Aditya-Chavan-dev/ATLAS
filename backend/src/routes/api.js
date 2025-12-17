const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Health Check
router.get('/', (req, res) => {
    res.json({
        status: 'active',
        service: 'ATLAS Notification Server',
        timestamp: new Date().toISOString(),
        version: '3.0.0 (Lean Render Build)'
    });
});

// FCM Routes
router.post('/fcm/register', notificationController.registerToken);
router.post('/fcm/unregister', notificationController.unregisterToken);
router.post('/fcm/broadcast', notificationController.broadcastAttendance);

module.exports = router;
