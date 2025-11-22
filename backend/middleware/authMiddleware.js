const { admin } = require('../config/firebaseConfig');

const verifyToken = async (req, res, next) => {
    console.log('[Auth Middleware] Request URL:', req.url);
    console.log('[Auth Middleware] Authorization Header:', req.headers.authorization);

    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
        console.error('[Auth Middleware] No token found in request');
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    console.log('[Auth Middleware] Token extracted:', token.substring(0, 20) + '...');

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('[Auth Middleware] Token verified successfully for user:', decodedToken.uid);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('[Auth Middleware] Token verification failed:', error.code, error.message);
        return res.status(403).json({
            message: 'Unauthorized: Invalid token',
            error: error.message
        });
    }
};

// Middleware to check if user has a specific role (stored in custom claims or DB)
const authorizeRole = (role) => {
    return (req, res, next) => {
        // In a real app, you'd check req.user.role or query the DB
        // For now, we pass through.
        next();
    };
};

module.exports = { verifyToken, authorizeRole };
