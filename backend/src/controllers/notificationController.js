```javascript
const { db } = require('../config/firebase');
const { sendPushNotification, sendTopicNotification, subscribeToTopic, unsubscribeFromTopic } = require('../services/notificationService');
const { sendEmail, generateEmailTemplate } = require('../services/emailService');
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

// Helper: Get Pending Employees (Expanded for detailed use)
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

            pendingEmployees.push({
                uid,
                fcmToken: emp.fcmToken,
                email: emp.email,
                name: emp.name || emp.displayName || 'Employee'
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
        console.log('📢 Triggering Manual Hybrid Reminder...');

        // NEW: Query /employees instead of /users
        const usersSnapshot = await db.ref('employees').once('value');
        const users = usersSnapshot.val() || {};

        // Segmentation
        const pushTokens = [];
        const emailTargets = [];

        Object.entries(users).forEach(([uid, user]) => {
            // Check Push Eligibility
            if (user.fcmToken && typeof user.fcmToken === 'string' && user.fcmToken.length > 0) {
                pushTokens.push(user.fcmToken);
            } 
            // Check Email Eligibility (Only if NO Push or as fallback? User said: "Whoever has not [app] we can send via email")
            else if (user.email) {
                emailTargets.push(user.email);
            }
        });

        console.log(`📋 Targets found: ${ pushTokens.length } Push, ${ emailTargets.length } Email`);

        // 1. Send Push
        let pushResult = { successCount: 0, failureCount: 0 };
        if (pushTokens.length > 0) {
            pushResult = await sendPushNotification(
                pushTokens,
                '📍 Mark Your Attendance',
                'Please mark your attendance for today.',
                {
                    type: 'MANUAL_REMINDER',
                    date: new Date().toISOString().split('T')[0],
                    requireInteraction: 'true'
                }
            );
        }

        // 2. Send Emails
        let emailCount = 0;
        if (emailTargets.length > 0) {
            const emailHtml = generateEmailTemplate(
                '📍 Mark Your Attendance',
                'Please mark your attendance for today. Since you do not have the app installed, please ensure you update your status.'
            );
            // Send individually or bcc? Individually is safer for "Your Attendance" context but slower.
            // Bcc is faster. Let's use individual for now or small batches. 
            // For simplicity in this demo, sending one Bcc batch or separate.
            // Nodemailer 'to' accepts array (comma separated).
            await sendEmail(emailTargets, 'Action Required: Mark Attendance', emailHtml);
            emailCount = emailTargets.length;
        }

        // Store notification record
        const notificationRef = db.ref('notifications').push();
        await notificationRef.set({
            title: '📍 Mark Your Attendance',
            body: 'Hybrid Reminder Sent',
            type: 'MANUAL_REMINDER',
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            target: 'ALL_EMPLOYEES',
            stats: {
                pushSent: pushTokens.length,
                emailSent: emailTargets.length,
                pushSuccess: pushResult.successCount
            }
        });

        res.json({
            success: true,
            message: `Reminder processing complete.`,
            stats: {
                push: { count: pushTokens.length, success: pushResult.successCount },
                email: { count: emailTargets.length }
            }
        });
    } catch (error) {
        console.error('❌ Error triggering reminder:', error);
        res.status(500).json({ error: error.message });
    }
};


exports.sendTestNotification = async (req, res) => {
    const { token, email, title, body } = req.body;

    const results = {};

    if (token) {
        results.push = await sendPushNotification(
            [token],
            title || 'Test Notification',
            body || 'This is a test notification from ATLAS',
            { type: 'TEST' }
        );
    }

    if (email) {
        const html = generateEmailTemplate(title || 'Test Notification', body || 'This is a test email.');
        results.email = await sendEmail(email, title || 'Test Email', html);
    }

    res.json(results);
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
[${ timestamp }]ERROR: ${ message }
URL: ${ url }
User - Agent: ${ userAgent }
Stack: ${ stack }
Component Stack: ${ componentStack || 'N/A' }
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
    console.log('⏰ 11:00 AM IST - Running Universal Hybrid Reminder...');
    const today = getTodayDateIST();
    // Use triggerReminder logic but adapted for cron (no res object)
    // For universal reminder, we fetch all users similar to triggerReminder
    try {
        const usersSnapshot = await db.ref('employees').once('value');
        const users = usersSnapshot.val() || {};
        
        const pushTokens = [];
        const emailTargets = [];

        Object.entries(users).forEach(([uid, user]) => {
            if (user.role === 'md' || user.role === 'admin') return;
            if (user.fcmToken) pushTokens.push(user.fcmToken);
            else if (user.email) emailTargets.push(user.email);
        });

        // Push
        if (pushTokens.length > 0) {
            await sendPushNotification(pushTokens, '📍 Mark Your Attendance', 'Good morning! Please mark your attendance.', { type: 'ATTENDANCE_REMINDER', date: today });
        }
        // Email
        if (emailTargets.length > 0) {
            const html = generateEmailTemplate('📍 Mark Your Attendance', 'Good morning! Please mark your attendance for today.');
            await sendEmail(emailTargets, 'Reminder: Mark Attendance', html);
        }
        console.log(`✅ Morning reminder: ${ pushTokens.length } Push, ${ emailTargets.length } Email`);
    } catch (e) {
        console.error("Error in morning reminder:", e);
    }
};

exports.runAfternoonReminder = async () => {
    console.log('⏰ 5:00 PM IST - Running Afternoon Pending Check...');
    const today = getTodayDateIST();
    try {
        const pendingEmployees = await getEmployeesWithoutAttendance(today);
        if (pendingEmployees.length === 0) {
            console.log('✅ All present.');
            return;
        }

        const pushTokens = [];
        const emailTargets = [];

        pendingEmployees.forEach(emp => {
            if (emp.fcmToken) pushTokens.push(emp.fcmToken);
            else if (emp.email) emailTargets.push(emp.email);
        });

        const title = '⚠️ Attendance Pending';
        const body = 'You haven\'t marked attendance today. Please do it immediately.';

        if (pushTokens.length > 0) {
            await sendPushNotification(pushTokens, title, body, { type: 'ATTENDANCE_REMINDER_URGENT', date: today });
        }
        if (emailTargets.length > 0) {
            const html = generateEmailTemplate(title, body);
            await sendEmail(emailTargets, 'Urgent: Attendance Pending', html);
        }
        console.log(`✅ Afternoon Pending Reminder: ${ pushTokens.length } Push, ${ emailTargets.length } Email`);
    } catch (e) {
        console.error("Error in afternoon reminder:", e);
    }
};
```
