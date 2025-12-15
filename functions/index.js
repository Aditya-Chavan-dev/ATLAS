/**
 * ATLAS Cloud Functions
 * 
 * Handles:
 * - Push notifications when demo is completed
 * - Sends FCM to owner's subscribed devices
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.database();
const messaging = admin.messaging();

// Owner email - only this user receives notifications
const OWNER_EMAIL = 'adityagchavan3@gmail.com';

/**
 * Trigger when a demo session is marked as completed
 * Sends push notification to owner's registered devices
 */
exports.onDemoCompleted = functions.database
    .ref('/demo/sessions/{sessionId}/completed')
    .onWrite(async (change, context) => {
        // Only trigger when completed changes to true
        const wasCompleted = change.before.val();
        const isCompleted = change.after.val();

        if (wasCompleted || !isCompleted) {
            console.log('Session not newly completed, skipping notification');
            return null;
        }

        const sessionId = context.params.sessionId;
        console.log(`Demo completed: ${sessionId}`);

        try {
            // Get session details
            const sessionSnapshot = await db.ref(`/demo/sessions/${sessionId}`).once('value');
            const session = sessionSnapshot.val();

            if (!session) {
                console.log('Session not found');
                return null;
            }

            // Get source label
            let sourceLabel = 'Direct';
            if (session.sourceId && session.sourceId !== 'direct') {
                const sourceSnapshot = await db.ref(`/demo/sources/${session.sourceId}`).once('value');
                const source = sourceSnapshot.val();
                if (source) {
                    sourceLabel = source.label;
                }
            }

            // Get owner's FCM tokens
            const tokensSnapshot = await db.ref('/ownerFcmTokens').once('value');
            const tokensData = tokensSnapshot.val();

            if (!tokensData) {
                console.log('No FCM tokens registered for owner');
                return null;
            }

            const tokens = Object.values(tokensData).map(t => t.token).filter(Boolean);

            if (tokens.length === 0) {
                console.log('No valid FCM tokens found');
                return null;
            }

            // Format duration
            const durationSec = Math.round((session.sessionDuration || 0) / 1000);
            const durationStr = durationSec < 60
                ? `${durationSec}s`
                : `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`;

            // Build notification
            const notification = {
                title: '🎉 Demo Completed!',
                body: `${sourceLabel} - ${session.deviceCategory || session.deviceType || 'Unknown'} (${durationStr})`,
            };

            const message = {
                notification,
                data: {
                    sessionId,
                    sourceId: session.sourceId || 'direct',
                    deviceType: session.deviceCategory || session.deviceType || 'unknown',
                    duration: String(session.sessionDuration || 0),
                },
                tokens,
            };

            // Send notification
            const response = await messaging.sendEachForMulticast(message);

            console.log(`Notification sent to ${response.successCount}/${tokens.length} devices`);

            // Clean up failed tokens
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });
                console.log('Failed tokens:', failedTokens);
            }

            return null;
        } catch (error) {
            console.error('Error sending notification:', error);
            return null;
        }
    });

/**
 * HTTP endpoint to register FCM token for owner
 * Called from MetricsDashboard when owner subscribes
 */
exports.registerOwnerFcmToken = functions.https.onCall(async (data, context) => {
    // Verify the caller is the owner
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    if (context.auth.token.email !== OWNER_EMAIL) {
        throw new functions.https.HttpsError('permission-denied', 'Only owner can register tokens');
    }

    const { token } = data;
    if (!token) {
        throw new functions.https.HttpsError('invalid-argument', 'Token is required');
    }

    // Store the token
    const tokenId = token.substring(0, 20); // Use first 20 chars as ID
    await db.ref(`/ownerFcmTokens/${tokenId}`).set({
        token,
        registeredAt: admin.database.ServerValue.TIMESTAMP,
        email: context.auth.token.email,
    });

    console.log(`FCM token registered for ${context.auth.token.email}`);
    return { success: true };
});

/**
 * HTTP endpoint to unregister FCM token
 */
exports.unregisterOwnerFcmToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { token } = data;
    if (!token) {
        throw new functions.https.HttpsError('invalid-argument', 'Token is required');
    }

    const tokenId = token.substring(0, 20);
    await db.ref(`/ownerFcmTokens/${tokenId}`).remove();

    console.log(`FCM token unregistered`);
    return { success: true };
});
