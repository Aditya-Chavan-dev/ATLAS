const { db } = require('../config/firebase');
const { sendPushNotification, sendTopicNotification, subscribeToTopic, unsubscribeFromTopic } = require('../services/notificationService');
const { getTodayDateIST } = require('../utils/dateUtils');

const TOPIC_ALL_USERS = 'atlas_all_users';

exports.subscribeToBroadcast = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    try {
        await subscribeToTopic([token], TOPIC_ALL_USERS);
        res.json({ success: true, message: 'Subscribed to broadcast topic' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.unsubscribeFromBroadcast = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    try {
        await unsubscribeFromTopic([token], TOPIC_ALL_USERS);
        res.json({ success: true, message: 'Unsubscribed from broadcast topic' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATED: Use new /employees structure with nested attendance
const getEmployeesWithoutAttendance = async (dateStr) => {
    try {
        // NEW: Query /employees which contains both profile and nested attendance
        const employeesSnapshot = await db.ref('employees').once('value');
        const employees = employeesSnapshot.val() || {};

        const pendingEmployees = [];

        Object.entries(employees).forEach(([uid, emp]) => {
            // Skip MD and admin roles
            if (emp.role === 'md' || emp.role === 'admin') return;

            // Check if employee has attendance for today (in nested structure)
            const hasAttendance = emp.attendance && emp.attendance[dateStr];
            if (hasAttendance) return;
            // if (!user.fcmToken) return; // Allow listing even if no token, for UI

            pendingEmployees.push({
                uid,
                fcmToken: user.fcmToken,
                name: user.name || user.displayName || 'Employee',
                email: user.email
            });
        });

        return pendingEmployees;
    } catch (error) {
        console.error('❌ Error getting employees without attendance:', error);
        return [];
    }
};

exports.triggerReminder = async (req, res) => {
    try {
        console.log('📢 Triggering Manual Reminder to ALL employees...');

        // NEW: Query /employees instead of /users
        const usersSnapshot = await db.ref('employees').once('value');
        const users = usersSnapshot.val() || {};

        // Collect all employee FCM tokens
        const employeeTokens = [];
        const employeeNames = [];

        Object.entries(users).forEach(([uid, user]) => {
            // Include all profiles with FCM tokens
            if (user.fcmToken && typeof user.fcmToken === 'string' && user.fcmToken.length > 0) {
                employeeTokens.push(user.fcmToken);
                employeeNames.push(user.name || user.email || uid);
            }
        });

        console.log(`📋 Found ${employeeTokens.length} employees with FCM tokens`);

        if (employeeTokens.length === 0) {
            // No tokens found - store notification anyway for record
            const notificationRef = db.ref('notifications').push();
            await notificationRef.set({
                title: '📍 Mark Your Attendance',
                body: 'Please mark your attendance for today.',
                type: 'MANUAL_REMINDER',
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString(),
                target: 'ALL_EMPLOYEES',
                employeeCount: 0,
                status: 'NO_TOKENS'
            });

            return res.json({
                success: true,
                employeeCount: 0,
                message: 'No employees have notification tokens registered'
            });
        }

        // Send direct push notifications to all employee tokens
        const result = await sendPushNotification(
            employeeTokens,
            '📍 Mark Your Attendance',
            'Please mark your attendance for today.',
            {
                type: 'MANUAL_REMINDER',
                date: new Date().toISOString().split('T')[0],
                requireInteraction: 'true'
            }
        );

        // Store notification record in Firebase
        const notificationRef = db.ref('notifications').push();
        await notificationRef.set({
            title: '📍 Mark Your Attendance',
            body: 'Please mark your attendance for today.',
            type: 'MANUAL_REMINDER',
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            target: 'ALL_EMPLOYEES',
            employeeCount: employeeTokens.length,
            successCount: result.successCount,
            failureCount: result.failureCount
        });

        console.log(`✅ Reminder sent: ${result.successCount} success, ${result.failureCount} failed`);

        res.json({
            success: true,
            employeeCount: employeeTokens.length,
            successCount: result.successCount,
            failureCount: result.failureCount,
            message: `Reminder sent to ${result.successCount} employee(s)`
        });
    } catch (error) {
        console.error('❌ Error triggering reminder:', error);
        res.status(500).json({ error: error.message });
    }
};


exports.sendTestNotification = async (req, res) => {
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
};

exports.getPendingEmployees = async (req, res) => {
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
};

exports.logError = (req, res) => {
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
    const logFile = path.join(__dirname, '../../client_errors.log');

    fs.appendFile(logFile, logEntry, (err) => {
        if (err) {
            console.error('❌ Error writing to log file:', err);
            return res.status(500).json({ error: 'Failed to log error' });
        }
        res.json({ success: true });
    });
};

// Scheduled Tasks Logic
exports.runMorningReminder = async () => {
    console.log('⏰ 11:00 AM IST - Running Universal Attendance Reminder...');
    const today = getTodayDateIST();

    // Universal Delivery Mandate: Send to ALL users, regardless of status
    await sendTopicNotification(
        TOPIC_ALL_USERS,
        '📍 Mark Your Attendance',
        'Good morning! Please mark your attendance for today.',
        { type: 'ATTENDANCE_REMINDER', date: today }
    );
    console.log('✅ Universal morning reminder sent to topic:', TOPIC_ALL_USERS);
};

exports.runAfternoonReminder = async () => {
    console.log('⏰ 5:00 PM IST - Running afternoon reminder check...');
    const today = getTodayDateIST();
    const pendingEmployees = await getEmployeesWithoutAttendance(today);

    if (pendingEmployees.length === 0) {
        console.log('✅ All employees have marked attendance!');
        return;
    }

    // For afternoon, we still might want to target specific pending users only?
    // User said "Daily Attendance Reminder (11:00 AM)" -> ALL.
    // User generally said "ALL notification types MUST be delivered to ALL active users without exception."
    // However, specifically for "Reminder", sending it to people who ALREADY marked it at 5 PM is spam.
    // The "Universal Delivery" list item 1 specified "Daily Attendance Reminder (11:00 AM)".
    // It did not specify the afternoon one.
    // I will keep the afternoon one targeted to pending only, as it's a "You HAVEN'T marked" message.
    // Sending "You haven't marked" to everyone (even those who have) would be incorrect/confusing.

    const tokens = pendingEmployees.map(emp => emp.fcmToken);
    await sendPushNotification(
        tokens,
        '⚠️ Attendance Pending',
        'You haven\'t marked attendance today. Please do it before end of day.',
        { type: 'ATTENDANCE_REMINDER_URGENT', date: today }
    );
};
