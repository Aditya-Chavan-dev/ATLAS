const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('../service-account.json');

const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://atlas-011-default-rtdb.firebaseio.com"
});

const db = getDatabase();
const auth = getAuth();

async function listUsers() {
    console.log('Fetching users...');

    const snapshot = await db.ref('employees').once('value');
    const employees = snapshot.val() || {};

    console.log('\n--- REGISTERED USERS (RTDB) ---');
    Object.entries(employees).forEach(([uid, data]) => {
        const profile = data.profile || {};
        console.log(`[${uid}] ${profile.email || 'No Email'} (${profile.role || 'No Role'}) - ${profile.status || 'No Status'}`);
    });

    console.log('\n--- ALL AUTH USERS (Auth) ---');
    // List batch of users, 1000 at a time.
    const listUsersResult = await auth.listUsers(1000);
    listUsersResult.users.forEach((userRecord) => {
        console.log(`[${userRecord.uid}] ${userRecord.email} - Last Sign-in: ${userRecord.metadata.lastSignInTime}`);
    });

    process.exit(0);
}

listUsers().catch(console.error);
