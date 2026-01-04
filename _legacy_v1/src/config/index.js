/**
 * Canonical Configuration Module
 * 
 * THIS IS THE ONLY PLACE WHERE IMPORT.META.ENV IS ALLOWED.
 * All other files must import config from here.
 */

const getEnv = (key, defaultValue = '') => {
    return import.meta.env[key] || defaultValue
}

export const config = {
    env: getEnv('MODE', 'development'),
    isDev: getEnv('DEV', false) || getEnv('MODE') === 'development',
    api: {
        url: getEnv('VITE_API_URL', 'https://atlas-backend-gncd.onrender.com')
    },
    firebase: {
        apiKey: getEnv('VITE_FIREBASE_API_KEY'),
        authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
        databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL'),
        projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
        storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
        appId: getEnv('VITE_FIREBASE_APP_ID'),
        vapidKey: getEnv('VITE_FIREBASE_VAPID_KEY')
    }
}
