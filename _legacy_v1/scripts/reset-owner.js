import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const TARGET_EMAIL = 'adityagchavan3@gmail.com';

const initializeFirebase = () => {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT in .env');
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://atlas-011-default-rtdb.asia-southeast1.firebasedatabase.app';

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL
    });
    console.log('✅ Admin SDK Initialized');
};

const resetOwner = async () => {
    try {
        initializeFirebase();

        console.log(`🔍 Searching for user: ${TARGET_EMAIL}`);

        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(TARGET_EMAIL);
            console.log(`✅ Found User UID: ${userRecord.uid}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log('ℹ️ User not found in Authentication. Checking DB cleanup anyway...');
            } else {
                throw error;
            }
        }

        if (userRecord) {
            // Delete from Auth
            await admin.auth().deleteUser(userRecord.uid);
            console.log(`🗑️ Deleted from Firebase Auth: ${userRecord.uid}`);
        }

        // Search DB for this email if UID wasn't found (fallback) or use UID
        const db = admin.database();

        if (userRecord) {
            // Direct delete by UID
            await db.ref(`employees/${userRecord.uid}`).remove();
            console.log(`🗑️ Deleted DB record for UID: ${userRecord.uid}`);
        } else {
            // Scan DB for email (SLOW but necessary if auth is gone but db remains)
            console.log('🔎 Scanning DB for orphaned records matching email...');
            const snapshot = await db.ref('employees').orderByChild('profile/email').equalTo(TARGET_EMAIL).once('value');
            if (snapshot.exists()) {
                const updates = {};
                snapshot.forEach(child => {
                    updates[child.key] = null;
                    console.log(`🗑️ Identified orphaned DB record: ${child.key}`);
                });
                await db.ref('employees').update(updates);
                console.log('✅ Orphaned records deleted.');
            } else {
                console.log('✅ No DB records found.');
            }
        }

        console.log('\n🎉 SUCCESS: Account completely wiped. You can now login fresh.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

resetOwner();
