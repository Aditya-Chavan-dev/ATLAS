const app = require('./src/app');
const cron = require('node-cron');
const { runMorningReminder, runAfternoonReminder } = require('./src/controllers/notificationController');

const PORT = process.env.PORT || 5000;

// Scheduled Jobs
// 10:00 AM IST (04:30 UTC) - Mon-Sat
cron.schedule('30 4 * * 1-6', runMorningReminder, { timezone: 'UTC' });

// 05:00 PM IST (11:30 UTC) - Mon-Sat
cron.schedule('30 11 * * 1-6', runAfternoonReminder, { timezone: 'UTC' });

app.listen(PORT, () => {
    console.log(`🚀 ATLAS Backend Refactored & Running on port ${PORT}`);
    console.log(`📅 Scheduled: 10 AM IST & 5 PM IST (Mon-Sat)`);
});
