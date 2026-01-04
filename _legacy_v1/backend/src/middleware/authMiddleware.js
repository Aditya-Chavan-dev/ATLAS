/**
 * ATLAS Auth Middleware
 * Verifies Firebase ID tokens on protected routes.
 * 
 * SECURITY: This middleware MUST be applied to all sensitive endpoints.
 */

const { admin } = require('../config/firebase');

/**
 * Verify Firebase ID Token
 * Extracts and verifies the Bearer token from Authorization header.
 * 
 * Usage: router.post('/protected-route', verifyToken, controller.handler)
 */
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check for Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[Auth] Missing or invalid Authorization header');
        return res.status(401).json({
            error: 'Unauthorized: No token provided',
            code: 'AUTH_NO_TOKEN'
        });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        // Verify the token with Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Attach user info to request for downstream handlers
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            // Custom claims (e.g., role) can be added here if set
        };

        console.log(`[Auth] Token verified for user: ${decodedToken.email || decodedToken.uid}`);
        next();
    } catch (error) {
        console.error('[Auth] Token verification failed:', error.code || error.message);

        // Handle specific Firebase errors
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                error: 'Unauthorized: Token expired',
                code: 'AUTH_TOKEN_EXPIRED'
            });
        }

        return res.status(401).json({
            error: 'Unauthorized: Invalid token',
            code: 'AUTH_INVALID_TOKEN'
        });
    }
};

/**
 * Verify Token and Check Role
 * Use this for admin-only routes.
 * 
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
const verifyTokenAndRole = (allowedRoles) => {
    return async (req, res, next) => {
        // First verify the token
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized: No token provided',
                code: 'AUTH_NO_TOKEN'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                emailVerified: decodedToken.email_verified,
            };

            // Fetch user's role from database
            const { db } = require('../config/firebase');
            const profileSnapshot = await db.ref(`employees/${decodedToken.uid}/profile`).once('value');
            const profile = profileSnapshot.val();

            if (!profile || !profile.role) {
                return res.status(403).json({
                    error: 'Forbidden: User has no role assigned',
                    code: 'AUTH_NO_ROLE'
                });
            }

            // Check if user's role is in allowed roles
            if (!allowedRoles.includes(profile.role.toLowerCase())) {
                console.warn(`[Auth] Access denied for ${profile.role} to ${allowedRoles.join('/')}-only route`);
                return res.status(403).json({
                    error: `Forbidden: ${allowedRoles.join(' or ')} access required`,
                    code: 'AUTH_INSUFFICIENT_ROLE'
                });
            }

            // Attach role to request
            req.user.role = profile.role;
            req.user.profile = profile;

            console.log(`[Auth] Role verified: ${profile.role} for ${decodedToken.email}`);
            next();
        } catch (error) {
            console.error('[Auth] Token/Role verification failed:', error.message);
            return res.status(401).json({
                error: 'Unauthorized: Token verification failed',
                code: 'AUTH_VERIFICATION_FAILED'
            });
        }
    };
};

module.exports = {
    verifyToken,
    verifyTokenAndRole
};
