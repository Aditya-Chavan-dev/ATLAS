const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin
// Note: You need to set GOOGLE_APPLICATION_CREDENTIALS in .env or provide serviceAccountKey.json
// For now, we'll use a placeholder or default application credentials if available.

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        console.log('Firebase Admin Initialized');
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

const db = admin.database();
const auth = admin.auth();

module.exports = { admin, db, auth };
