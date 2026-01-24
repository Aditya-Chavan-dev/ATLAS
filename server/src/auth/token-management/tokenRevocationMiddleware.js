/**
 * PURPOSE: Middleware to check token revocation on EVERY request
 * SECURITY: Prevents stale token exploitation
 * PERFORMANCE: Uses checkRevoked flag in verifyIdToken
 */
const { admin } = require('../../../config/firebase');

const checkTokenRevocation = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Let main auth middleware handle missing tokens, 
        // or if this is used standalone:
        return res.status(401).json({ error: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        // CRITICAL: checkRevoked = true triggers a call to Firebase Auth Server
        // to verify if the token has been revoked (e.g. via revokeRefreshTokens)
        // This adds latency but improves security.
        const decodedToken = await admin.auth().verifyIdToken(idToken, true);

        req.decodedToken = decodedToken; // Pass forward
        next();
    } catch (error) {
        if (error.code === 'auth/id-token-revoked') {
            return res.status(401).json({
                error: 'Session revoked',
                code: 'AUTH_TOKEN_REVOKED'
            });
        }
        // Let standard auth middleware handle other errors or re-throw
        next(error);
    }
};

module.exports = checkTokenRevocation;
