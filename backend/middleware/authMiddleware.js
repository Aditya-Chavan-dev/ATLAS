const { admin } = require('../config/firebaseConfig');

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(403).json({ message: 'Unauthorized: Invalid token' });
    }
};

// Middleware to check if user has a specific role (stored in custom claims or DB)
// For this MVP, we might just check a flag or assume role management is handled elsewhere for now.
// We'll add a placeholder for role checking.
const authorizeRole = (role) => {
    return (req, res, next) => {
        // In a real app, you'd check req.user.role or query the DB
        // For now, we pass through.
        next();
    };
};

module.exports = { verifyToken, authorizeRole };
