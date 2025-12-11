const { db } = require('../config/firebase');
const { sendPushNotification } = require('../services/notificationService');
const { getTodayDateIST } = require('../utils/dateUtils');

const getEmployeesWithoutAttendance = async (dateStr) => {
    try {
        const usersSnapshot = await db.ref('users').once('value');
        const users = usersSnapshot.val() || {};

        const attendanceSnapshot = await db.ref('attendance').once('value');
        const allAttendance = attendanceSnapshot.val() || {};

        const todayAttendanceEmployeeIds = new Set();
        Object.values(allAttendance).forEach(record => {
            if (record.date === dateStr && record.employeeId) {
                todayAttendanceEmployeeIds.add(record.employeeId);
            }
        });

        const pendingEmployees = [];

        Object.entries(users).forEach(([uid, user]) => {
            if (user.role === 'md' || user.role === 'admin') return;
            if (todayAttendanceEmployeeIds.has(uid)) return;
            if (!user.fcmToken) return;

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

// Scheduled Tasks Logic (can be exported if needed or run in server.js)
exports.runMorningReminder = async () => {
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
};

exports.runAfternoonReminder = async () => {
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
};
