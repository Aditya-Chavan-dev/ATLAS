// ⚠️ ⚠️ ⚠️ CRITICAL - DO NOT MODIFY ⚠️ ⚠️ ⚠️
// This script generates Firebase config from environment variables
// Any changes may break the build process or Firebase initialization
// Last verified working: 2025-12-12
// This script runs during: npm run build and npm run dev
// If you need to make changes, consult the deployment documentation first
// ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');


// Load environment variables based on mode (if needed, but simple .env loading here)
dotenv.config();

const configPath = path.join(__dirname, '../public/config');
const configFile = path.join(configPath, 'firebase-config.json');

// Ensure directory exists
if (!fs.existsSync(configPath)) {
    fs.mkdirSync(configPath, { recursive: true });
}

// Map env vars to config object
// Note: These must match what's in your .env file
const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

// Write config file
try {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log('✅ Generated public/config/firebase-config.json from environment variables');
} catch (error) {
    console.error('❌ Error generating firebase-config.json:', error);
    process.exit(1);
}

// Inject Firebase config into service worker
const swTemplatePath = path.join(__dirname, '../public/firebase-messaging-sw.js');
if (fs.existsSync(swTemplatePath)) {
    try {
        let swContent = fs.readFileSync(swTemplatePath, 'utf8');

        // Replace placeholders with actual values
        swContent = swContent
            .replace('"__FIREBASE_API_KEY__"', JSON.stringify(config.apiKey))
            .replace('"__FIREBASE_AUTH_DOMAIN__"', JSON.stringify(config.authDomain))
            .replace('"__FIREBASE_DATABASE_URL__"', JSON.stringify(config.databaseURL))
            .replace('"__FIREBASE_PROJECT_ID__"', JSON.stringify(config.projectId))
            .replace('"__FIREBASE_STORAGE_BUCKET__"', JSON.stringify(config.storageBucket))
            .replace('"__FIREBASE_MESSAGING_SENDER_ID__"', JSON.stringify(config.messagingSenderId))
            .replace('"__FIREBASE_APP_ID__"', JSON.stringify(config.appId));

        // Write to dist folder (will be created during build)
        const distSwPath = path.join(__dirname, '../dist/firebase-messaging-sw.js');
        const distDir = path.dirname(distSwPath);

        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
        }

        fs.writeFileSync(distSwPath, swContent);
        console.log('✅ Injected Firebase config into firebase-messaging-sw.js');
    } catch (error) {
        console.error('❌ Error injecting config into service worker:', error);
        // Don't exit - service worker is optional for some builds
    }
}

