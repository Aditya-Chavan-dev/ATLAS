const admin = require('firebase-admin');
require('dotenv').config();

const initializeFirebase = () => {
    if (admin.apps.length > 0) {
        return admin.apps[0];
    }

    let credential;

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
        console.log('⚠️ No FIREBASE_SERVICE_ACCOUNT found. Using default credentials.');
        credential = admin.credential.applicationDefault();
    }

    return admin.initializeApp({
        credential: credential,
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://atlas-011-default-rtdb.firebaseio.com'
    });
};

const app = initializeFirebase();
const db = admin.database();
const messaging = admin.messaging();

module.exports = { admin, db, messaging };
