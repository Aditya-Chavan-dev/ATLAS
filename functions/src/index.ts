import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp();
}

// Export Auth functions
export * from './auth/onUserCreate';
export * from './auth/verifyTokenVersion';

// Export Attendance functions (placeholder until re-implemented)
// export * from './attendance'; 
