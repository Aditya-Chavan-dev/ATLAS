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


// ============================================================================
// INJECT FIREBASE CONFIG INTO UNIFIED SERVICE WORKER
// ============================================================================
// The unified SW (src/sw.js) contains placeholders that need to be replaced
// This happens BEFORE Vite processes the file
const swSourcePath = path.join(__dirname, '../src/sw.js');

if (fs.existsSync(swSourcePath)) {
    try {
        let swContent = fs.readFileSync(swSourcePath, 'utf8');

        // Check if placeholders exist (they should)
        if (!swContent.includes('__FIREBASE_API_KEY__')) {
            console.log('⚠️  Service worker already has config injected or no placeholders found');
        } else {
            // Replace ALL placeholders with actual values
            swContent = swContent
                .replace(/"__FIREBASE_API_KEY__"/g, JSON.stringify(config.apiKey))
                .replace(/"__FIREBASE_AUTH_DOMAIN__"/g, JSON.stringify(config.authDomain))
                .replace(/"__FIREBASE_DATABASE_URL__"/g, JSON.stringify(config.databaseURL))
                .replace(/"__FIREBASE_PROJECT_ID__"/g, JSON.stringify(config.projectId))
                .replace(/"__FIREBASE_STORAGE_BUCKET__"/g, JSON.stringify(config.storageBucket))
                .replace(/"__FIREBASE_MESSAGING_SENDER_ID__"/g, JSON.stringify(config.messagingSenderId))
                .replace(/"__FIREBASE_APP_ID__"/g, JSON.stringify(config.appId));

            // Write back to the SAME file (Vite will process it)
            fs.writeFileSync(swSourcePath, swContent);
            console.log('✅ Injected Firebase config into src/sw.js (unified service worker)');
        }
    } catch (error) {
        console.error('❌ Error injecting config into service worker:', error);
        // Don't exit - let build continue
    }
} else {
    console.error('⚠️  Service worker not found at src/sw.js');
}


