const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://atlas-v2-default-rtdb.firebaseio.com'
});

const db = admin.database();

const holidays2026 = [
    '2026-01-26', // Republic Day
    '2026-08-15', // Independence Day
    '2026-10-02', // Gandhi Jayanti
    '2026-11-01', // Diwali
    '2026-12-25'  // Christmas
];

async function populateHolidays() {
    try {
        await db.ref('config/holidays/2026').set(holidays2026);
        console.log('✅ Holidays populated successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

populateHolidays();
