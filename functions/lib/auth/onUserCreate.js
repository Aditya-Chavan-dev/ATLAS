"use strict";
/**
 * Cloud Function: onUserCreate
 *
 * Triggered when a new user signs in for the first time.
 * Checks if the user's email is whitelisted and sets custom claims.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreate = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email } = user;
    // Email is required
    if (!email) {
        await admin.auth().deleteUser(uid);
        throw new functions.https.HttpsError('invalid-argument', 'Email is required');
    }
    // Check if email is in whitelist (Firestore /users collection)
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef
        .where('email', '==', email)
        .where('status', '==', 'active')
        .get();
    // Email not authorized
    if (snapshot.empty) {
        await admin.auth().deleteUser(uid);
        console.error(`[SECURITY] Unauthorized sign-in attempt: ${email}`);
        throw new functions.https.HttpsError('permission-denied', 'This email is not authorized to access ATLAS');
    }
    // Email authorized - get user data
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    // Update UID in Firestore
    await userDoc.ref.update({
        uid,
        updated_at: new Date().toISOString()
    });
    // Set custom claims (role + token_version)
    await admin.auth().setCustomUserClaims(uid, {
        role: userData.role,
        token_version: userData.token_version || 1
    });
    console.log(`[AUTH] ${email} authenticated with role: ${userData.role}, token_version: ${userData.token_version || 1}`);
});
//# sourceMappingURL=onUserCreate.js.map