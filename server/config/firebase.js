const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables if not already loaded
dotenv.config();

if (!admin.apps.length) {
    try {
        // In local development, we might not have the env var set yet, 
        // or we rely on default google application credentials if hosted on GCP/Render?
        // Render usually provides it as an env var if configured.

        let credential;

        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            credential = admin.credential.cert(serviceAccount);
        } else {
            console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT is missing. Attempting to use default application credentials or unauthenticated access...");
            credential = admin.credential.applicationDefault();
        }

        admin.initializeApp({
            credential: credential,
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });

        // Suppress logging in test environment unless debug is on
        if (process.env.NODE_ENV !== 'test') {
            console.log("🔥 Firebase Admin SDK initialized");
        }

    } catch (error) {
        console.error("❌ Firebase initialization failed:", error.message);
    }
}

const db = admin.database();

module.exports = {
    admin,
    db
};
