import admin from 'firebase-admin';
import './env'; // Ensure env vars are loaded

if (!admin.apps.length) {
    try {
        const rawKey = process.env.FIREBASE_PRIVATE_KEY;
        if (!rawKey) throw new Error('FIREBASE_PRIVATE_KEY is missing');

        // Handle potential newline escaping issues in ENV variables
        const privateKey = rawKey.replace(/\\n/g, '\n');

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        console.log('✅ Firebase Admin Initialized');
    } catch (error) {
        console.error('❌ Firebase Init Failed:', error);
        process.exit(1);
    }
}

export const firebaseAuth = admin.auth();
