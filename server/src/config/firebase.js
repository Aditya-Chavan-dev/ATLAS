const admin = require('firebase-admin');
const { createProtectedAdminRef } = require('../utils/demoGuard');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env');
require('dotenv').config({ path: envPath });

console.log('🔧 Initializing Firebase Admin SDK...');
console.log('Environment check:', {
    hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    hasDatabaseURL: !!process.env.FIREBASE_DATABASE_URL,
    nodeEnv: process.env.NODE_ENV || 'development'
});

const initializeFirebase = () => {
    if (admin.apps.length > 0) {
        console.log('✅ Firebase already initialized');
        return admin.apps[0];
    }

    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            credential = admin.credential.cert(serviceAccount);
            console.log('✅ Firebase credential loaded from FIREBASE_SERVICE_ACCOUNT');
        } catch (error) {
            console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT:', error.message);
            throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
        }
    } else {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is missing!');
        throw new Error('FIREBASE_SERVICE_ACCOUNT is required');
    }

    const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://atlas-011-default-rtdb.asia-southeast1.firebasedatabase.app';

    console.log('🔗 Connecting to Firebase Database:', databaseURL);

    try {
        const app = admin.initializeApp({
            credential: credential,
            databaseURL: databaseURL
        });
        console.log('✅ Firebase Admin SDK initialized successfully');
        return app;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error.message);
        throw error;
    }
};

// Initialize Firebase
let app, db, messaging;

try {
    app = initializeFirebase();
    const rawDb = admin.database();

    // CRITICAL SECURITY: Wrap database with demo path protection guard
    db = new Proxy(rawDb, {
        get(target, prop) {
            if (prop === 'ref') {
                return function (path) {
                    const ref = target.ref(path);
                    return createProtectedAdminRef(ref);
                };
            }
            return target[prop];
        }
    });

    messaging = admin.messaging();
    console.log('✅ Firebase services ready (database with demo protection, messaging)');
} catch (error) {
    console.error('❌ CRITICAL: Firebase initialization failed:', error.message);
    console.error('The server will start but Firebase features will not work.');
    console.error('Please check your environment variables on Render dashboard.');
    // Don't exit - let the server start so we can see health check
}

module.exports = { admin, db, messaging };


