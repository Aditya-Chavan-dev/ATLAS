// ATLAS Notification Server
// Handles push notifications for the ATLAS attendance system
// Deployed on Render

const express = require('express');
const admin = require('firebase-admin');
const cron = require('node-cron');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Firebase Admin Initialization ---
// On Render: Use environment variable FIREBASE_SERVICE_ACCOUNT (JSON string)
// Locally: Use service account file

const initializeFirebase = () => {
    if (admin.apps.length > 0) {
        return admin.apps[0];
    }

    let credential;

    // Check for environment variable (Render deployment)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            credential = admin.credential.cert(serviceAccount);
            console.log('✅ Firebase initialized with environment variable');
        } catch (error) {
            console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT:', error);
            process.exit(1);
        }
    } else {
        // Local development - will use default credentials or fail gracefully
        console.log('⚠️ No FIREBASE_SERVICE_ACCOUNT found. Using default credentials.');
        credential = admin.credential.applicationDefault();
    }

    return admin.initializeApp({
        credential: credential,
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://atlas-011-default-rtdb.firebaseio.com'
    });
};

initializeFirebase();
const db = admin.database();

// --- Helper Functions ---

/**
 * Send FCM push notification to multiple tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
    if (!tokens || tokens.length === 0) {
        console.log('No tokens to send notifications to');
        return { successCount: 0, failureCount: 0 };
    }

    // Filter out invalid tokens
    const validTokens = tokens.filter(t => t && typeof t === 'string' && t.length > 0);

    if (validTokens.length === 0) {
        console.log('No valid tokens after filtering');
        return { successCount: 0, failureCount: 0 };
    }

    const message = {
        notification: {
            title,
            body
        },
        data: {
            ...data,
            timestamp: new Date().toISOString(),
            click_action: 'FLUTTER_NOTIFICATION_CLICK' // For mobile app compatibility
        },
        tokens: validTokens
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`📤 Push sent: ${response.successCount} success, ${response.failureCount} failed`);

        // Log failed tokens for debugging
        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.log(`  ❌ Token ${idx}: ${resp.error?.code} - ${resp.error?.message}`);
                }
            });
        }

        return {
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    } catch (error) {
        console.error('❌ Error sending push notification:', error);
        return { successCount: 0, failureCount: tokens.length, error: error.message };
    }
};

/**
 * Get today's date in YYYY-MM-DD format (IST)
 */
const getTodayDateIST = () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
};

/**
 * Check if today is a Sunday (in IST)
 */
const isSundayIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.getUTCDay() === 0;
};

/**
 * Get all employees who haven't marked attendance today
 * @returns {Promise<Array>} Array of { uid, fcmToken, name, email }
 */
const getEmployeesWithoutAttendance = async (dateStr) => {
    try {
        // Get all users
        const usersSnapshot = await db.ref('users').once('value');
        const users = usersSnapshot.val() || {};

        // Get all attendance records for today
        const attendanceSnapshot = await db.ref('attendance').once('value');
        const allAttendance = attendanceSnapshot.val() || {};

        // Find employees who have marked attendance today
        const todayAttendanceEmployeeIds = new Set();
        Object.values(allAttendance).forEach(record => {
            if (record.date === dateStr && record.employeeId) {
                todayAttendanceEmployeeIds.add(record.employeeId);
            }
        });

        // Filter employees who haven't marked attendance and have FCM tokens
        const pendingEmployees = [];

        Object.entries(users).forEach(([uid, user]) => {
            // Skip if not an employee or is MD
            if (user.role === 'md' || user.role === 'admin') return;

            // Skip if already marked attendance today
            if (todayAttendanceEmployeeIds.has(uid)) return;

            // Skip if no FCM token
            if (!user.fcmToken) return;

            pendingEmployees.push({
                uid,
                fcmToken: user.fcmToken,
                name: user.name || user.displayName || 'Employee',
                email: user.email
            });
        });

        console.log(`📊 Found ${pendingEmployees.length} employees without attendance for ${dateStr}`);
        return pendingEmployees;
    } catch (error) {
        console.error('❌ Error getting employees without attendance:', error);
        return [];
    }
};

// --- Scheduled Jobs ---

// 10:00 AM IST Reminder (Monday to Saturday)
// IST is UTC+5:30, so 10:00 AM IST = 04:30 UTC
cron.schedule('30 4 * * 1-6', async () => {
    console.log('⏰ 10:00 AM IST - Running attendance reminder...');

    const today = getTodayDateIST();
    const pendingEmployees = await getEmployeesWithoutAttendance(today);

    if (pendingEmployees.length === 0) {
        console.log('✅ All employees have marked attendance!');
        return;
    }

    const tokens = pendingEmployees.map(emp => emp.fcmToken);

    await sendPushNotification(
        tokens,
        '📍 Mark Your Attendance',
        'Good morning! Please mark your attendance for today.',
        { type: 'ATTENDANCE_REMINDER', date: today }
    );
}, {
    timezone: 'UTC' // Render uses UTC, cron time is adjusted
});

// Optional: 5:00 PM IST Reminder for those who still haven't marked
// 5:00 PM IST = 11:30 UTC
cron.schedule('30 11 * * 1-6', async () => {
    console.log('⏰ 5:00 PM IST - Running afternoon reminder...');

    const today = getTodayDateIST();
    const pendingEmployees = await getEmployeesWithoutAttendance(today);

    if (pendingEmployees.length === 0) {
        console.log('✅ All employees have marked attendance!');
        return;
    }

    const tokens = pendingEmployees.map(emp => emp.fcmToken);

    await sendPushNotification(
        tokens,
        '⚠️ Attendance Pending',
        'You haven\'t marked attendance today. Please do it before end of day.',
        { type: 'ATTENDANCE_REMINDER_URGENT', date: today }
    );
}, {
    timezone: 'UTC'
});

// --- API Routes ---

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'active',
        service: 'ATLAS Notification Server',
        timestamp: new Date().toISOString(),
        scheduled: {
            morningReminder: '10:00 AM IST (Mon-Sat)',
            afternoonReminder: '5:00 PM IST (Mon-Sat)'
        }
    });
});

// Manual trigger for testing
app.post('/api/trigger-reminder', async (req, res) => {
    try {
        const today = getTodayDateIST();
        const pendingEmployees = await getEmployeesWithoutAttendance(today);

        if (pendingEmployees.length === 0) {
            return res.json({
                success: true,
                message: 'All employees have marked attendance',
                pendingCount: 0
            });
        }

        const tokens = pendingEmployees.map(emp => emp.fcmToken);
        const result = await sendPushNotification(
            tokens,
            '📍 Mark Your Attendance',
            'Please mark your attendance for today.',
            { type: 'MANUAL_REMINDER', date: today }
        );

        res.json({
            success: true,
            pendingEmployees: pendingEmployees.length,
            ...result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send notification to specific user (for testing)
app.post('/api/send-test', async (req, res) => {
    const { token, title, body } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    const result = await sendPushNotification(
        [token],
        title || 'Test Notification',
        body || 'This is a test notification from ATLAS',
        { type: 'TEST' }
    );

    res.json(result);
});

// Get pending employees (debug endpoint)
app.get('/api/pending-employees', async (req, res) => {
    const today = getTodayDateIST();
    const pending = await getEmployeesWithoutAttendance(today);

    res.json({
        date: today,
        count: pending.length,
        employees: pending.map(e => ({
            name: e.name,
            email: e.email,
            hasToken: !!e.fcmToken
        }))
    });
});

// Log client-side errors
app.post('/api/log-error', (req, res) => {
    const { message, stack, componentStack, url, userAgent, timestamp } = req.body;
    const logEntry = `
[${timestamp}] ERROR: ${message}
URL: ${url}
User-Agent: ${userAgent}
Stack: ${stack}
Component Stack: ${componentStack || 'N/A'}
--------------------------------------------------
`;

    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, 'client_errors.log');

    fs.appendFile(logFile, logEntry, (err) => {
        if (err) {
            console.error('❌ Error writing to log file:', err);
            return res.status(500).json({ error: 'Failed to log error' });
        }
        res.json({ success: true });
    });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 ATLAS Notification Server running on port ${PORT}`);
    console.log(`📅 Scheduled: 10 AM IST reminder (Mon-Sat)`);
    console.log(`📅 Scheduled: 5 PM IST reminder (Mon-Sat)`);
});
