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
import { getMessaging, onMessage } from 'firebase/messaging';
import { useNavigate } from 'react-router-dom';

import { config } from '../config';

// Firebase configuration - using environment variables
// These are injected at build time by Vite
const firebaseConfig = {
    apiKey: config.firebase.apiKey,
    authDomain: config.firebase.authDomain,
    databaseURL: config.firebase.databaseURL,
    projectId: config.firebase.projectId,
    storageBucket: config.firebase.storageBucket,
    messagingSenderId: config.firebase.messagingSenderId,
    appId: config.firebase.appId
};

// Validate required config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Missing required Firebase configuration!');
    console.error('Please ensure all VITE_FIREBASE_* environment variables are set in your .env file');
    throw new Error('Firebase configuration is incomplete. Check your .env file.');
}


// Ensure environment variables are loaded correctly
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    console.error('❌ Missing Firebase configuration. Check your environment variables.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

import { getStorage } from 'firebase/storage';

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Firebase Messaging
export const messaging = getMessaging(app);

// Foreground messages are handled in App.jsx via setupForegroundListener in fcm.js

// Export the app instance (optional, for advanced use cases)
export default app;
