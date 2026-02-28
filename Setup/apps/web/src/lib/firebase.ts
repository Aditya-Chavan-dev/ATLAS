import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_DATABASE_URL',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
] as const;

// 🛡️ Hard Environment Validator
function validateEnv() {
    const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);
    if (missing.length > 0) {
        throw new Error(
            `[FATAL] Missing required environment variables: ${missing.join(', ')}. The application cannot start in a misconfigured state.`
        );
    }
}

validateEnv();

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 🏁 Double-Init Guard
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 👤 Auth Context & Persistence
const auth: Auth = getAuth(app);

// 🛡️ Immediate Persistence Guard
setPersistence(auth, browserSessionPersistence).catch((error) => {
    throw new Error(`[FATAL] Failed to set auth persistence: ${error.message}`);
});

const db: Database = getDatabase(app);

export { app, auth, db };
export default app;
