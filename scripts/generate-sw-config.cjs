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
