import { onRequest } from 'firebase-functions/v2/https';
import { app } from './server';
import { pool } from './config/database';

// Ensure DB connection is handled for serverless 'warm' starts if needed.
// However, the pool handles connections automatically. 
// validateEnv is called on import of server.ts.

export const api = onRequest({
    region: 'us-central1', // Set your region
    maxInstances: 10,
    secrets: ["DATABASE_URL", "FIREBASE_PRIVATE_KEY", "ROOT_OWNER_EMAIL"]
    // Note: You must set these secrets using `firebase functions:secrets:set`
}, app);
