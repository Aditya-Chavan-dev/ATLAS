/**
 * PURPOSE: Middleware to check blacklist on EVERY request
 * SECURITY: First line of defense against suspended users
 * PERFORMANCE: In-memory check (sub-millisecond)
 */
const blacklistService = require('./sessionBlacklistService');

const checkBlacklist = async (req, res, next) => {
    try {
        // Can be populated by previous middleware
        const uid = req.decodedToken?.uid || req.user?.uid;

        if (uid) {
            const blocked = await blacklistService.isBlacklisted(uid);
            if (blocked) {
                console.warn(`[AUTH] Blocked blacklisted user: ${uid} (${blocked.reason})`);
                return res.status(403).json({
                    error: 'Access denied: Account suspended or session revoked',
                    code: 'AUTH_SESSION_BLACKLISTED',
                    reason: blocked.reason
                });
            }
        }
        next();
    } catch (error) {
        console.error('[AUTH] Blacklist check error:', error);
        // Fail Closed
        res.status(500).json({ error: 'Security check failed' });
    }
};

module.exports = checkBlacklist;
