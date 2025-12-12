// ⚠️ ⚠️ ⚠️ CRITICAL - DO NOT MODIFY ⚠️ ⚠️ ⚠️
// This file contains FROZEN authentication configuration
// Any changes to this file may break authentication system-wide
// Last verified working: 2025-12-12
// If you need to make changes, consult the deployment documentation first
// ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️

// Firebase Configuration File
// This file initializes Firebase services for the ATLAS attendance system


import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase configuration - using environment variables
// These are injected at build time by Vite
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate required config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Missing required Firebase configuration!');
    console.error('Please ensure all VITE_FIREBASE_* environment variables are set in your .env file');
    throw new Error('Firebase configuration is incomplete. Check your .env file.');
}



// Log config for debugging (remove in production)
console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? '✓ Set' : '✗ Missing',
    authDomain: firebaseConfig.authDomain ? '✓ Set' : '✗ Missing',
    projectId: firebaseConfig.projectId ? '✓ Set' : '✗ Missing',
});

// Ensure environment variables are loaded correctly
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    console.error('❌ Missing Firebase configuration. Check your environment variables.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Export the app instance (optional, for advanced use cases)
export default app;
