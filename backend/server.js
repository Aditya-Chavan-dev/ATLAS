const app = require('./src/app');
const cron = require('node-cron');
const { runMorningReminder, runAfternoonReminder } = require('./src/controllers/notificationController');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Required for Render

console.log('🚀 Starting ATLAS Backend Server...');
console.log('📋 Configuration:', {
    port: PORT,
    host: HOST,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'production'
});

// Scheduled Jobs
console.log('⏰ Setting up cron jobs...');

// 11:00 AM IST (05:30 UTC) - Mon-Sat
cron.schedule('30 5 * * 1-6', () => {
    console.log('⏰ Running morning reminder (11 AM IST)...');
    runMorningReminder();
}, { timezone: 'UTC' });

// 05:00 PM IST (11:30 UTC) - Mon-Sat
cron.schedule('30 11 * * 1-6', () => {
    console.log('⏰ Running afternoon reminder (5 PM IST)...');
    runAfternoonReminder();
}, { timezone: 'UTC' });

console.log('✅ Cron jobs scheduled: 10 AM IST & 5 PM IST (Mon-Sat)');

// Start server
const server = app.listen(PORT, HOST, () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('🚀 ATLAS Backend Server is LIVE!');
    console.log('═══════════════════════════════════════════');
    console.log(`📍 URL: http://${HOST}:${PORT}`);
    console.log(`📅 Scheduled: 10 AM IST & 5 PM IST (Mon-Sat)`);
    console.log(`⏰ Server Time: ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════════');
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('⚠️ SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

