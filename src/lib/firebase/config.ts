// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseURL: "https://atlas-011-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize other services
export const database = getDatabase(app);
export const functions = getFunctions(app);

// Initialize Analytics & Performance (Safe Mode)
let analyticsInstance = null;
let performanceInstance = null;

// Only initialize Analytics/Performance in Production or if explicitly enabled
// This prevents "ERR_BLOCKED_BY_CLIENT" errors in local dev due to ad-blockers
if (typeof window !== 'undefined' && import.meta.env.PROD) {
    try {
        analyticsInstance = getAnalytics(app);
    } catch (e) {
        console.warn("Analytics blocked (likely AdBlocker). Continuing...");
    }

    try {
        performanceInstance = getPerformance(app);
    } catch (e) {
        console.warn("Performance monitoring blocked. Continuing...");
    }
} else {
    console.log("Dev Mode: Analytics & Performance monitoring disabled.");
}

export const analytics = analyticsInstance;
export const performance = performanceInstance;

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});
