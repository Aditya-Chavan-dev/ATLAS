"use strict";
/**
 * Helper function: verifyTokenVersion
 *
 * Verifies that the token version in the ID token matches
 * the token version in Firestore. This enables instant logout.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTokenVersion = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
async function verifyTokenVersion(uid, tokenVersion) {
    const userDoc = await admin.firestore()
        .collection('users')
        .doc(uid)
        .get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
    }
    const userData = userDoc.data();
    // Check token version
    if (tokenVersion !== userData.token_version) {
        throw new functions.https.HttpsError('unauthenticated', 'Token has been revoked. Please sign in again.');
    }
    // Check if user is active
    if (userData.status !== 'active') {
        throw new functions.https.HttpsError('permission-denied', 'Account is disabled');
    }
}
exports.verifyTokenVersion = verifyTokenVersion;
//# sourceMappingURL=verifyTokenVersion.js.map