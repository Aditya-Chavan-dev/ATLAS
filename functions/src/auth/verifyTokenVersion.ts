/**
 * Helper function: verifyTokenVersion
 * 
 * Verifies that the token version in the ID token matches
 * the token version in Firestore. This enables instant logout.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export async function verifyTokenVersion(
    uid: string,
    tokenVersion: number
): Promise<void> {
    const userDoc = await admin.firestore()
        .collection('users')
        .doc(uid)
        .get();

    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data()!;

    // Check token version
    if (tokenVersion !== userData.token_version) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Token has been revoked. Please sign in again.'
        );
    }

    // Check if user is active
    if (userData.status !== 'active') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Account is disabled'
        );
    }
}
