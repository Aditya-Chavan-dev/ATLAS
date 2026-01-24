/**
 * PURPOSE: Single source of truth for authorization checks
 * SECURITY: Eliminates fragmentation between DB and Custom Claims
 * SCOPE: Replaces ALL existing auth middleware
 */
const { admin, db } = require('../../../config/firebase');
const tokenRevocationService = require('../token-management/tokenRevocationService');
const blacklistService = require('../session-blacklist/sessionBlacklistService');
const auditLogger = require('../audit/auditLogger');
const authPerformanceOptimizer = require('../performanceOptimizations');

const authenticateAndAuthorize = async (req, res, next) => {
    try {
        // STEP 1: Extract Token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const idToken = authHeader.split('Bearer ')[1];

        // STEP 2: Verify Token & Check Revocation
        // This implicitly calls Firebase Auth to check if token is revoked
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken, true);
        } catch (error) {
            console.warn(`[AUTH] Token Verification Failed: ${error.code}`);
            if (error.code === 'auth/id-token-revoked') {
                return res.status(401).json({ error: 'Session revoked', code: 'AUTH_TOKEN_REVOKED' });
            }
            if (error.code === 'auth/id-token-expired') {
                return res.status(401).json({ error: 'Token expired', code: 'AUTH_TOKEN_EXPIRED' });
            }
            return res.status(401).json({ error: 'Invalid token' });
        }

        const uid = decodedToken.uid;

        // STEP 3: Check Session Blacklist (CRITICAL)
        // Instant rejection for suspended/terminated users
        const isBlacklisted = await blacklistService.isBlacklisted(uid);
        if (isBlacklisted) {
            return res.status(403).json({
                error: 'Session blocked',
                code: 'AUTH_SESSION_BLOCKED',
                reason: isBlacklisted.reason
            });
        }

        // STEP 4: Fetch Current Profile from DB (Source of Truth)
        // We use a short-lived cache (1 min) to reduce DB hits.
        // Cache is invalidated immediately on role change via roleManagementController.
        let profile = authPerformanceOptimizer.getCachedRole(uid);

        if (!profile) {
            const profileSnapshot = await db.ref(`employees/${uid}/profile`).once('value');
            profile = profileSnapshot.val();

            if (!profile) {
                console.warn(`[AUTH] No profile found for ${uid}`);
                return res.status(403).json({ error: 'User profile not found', code: 'AUTH_NO_PROFILE' });
            }

            // Rewrite cache with full profile or just role? 
            // Middleware needs status + role. Cache full object for simplicity.
            authPerformanceOptimizer.cacheRole(uid, profile);
        }

        // STEP 5: Check Status (FIXES SUSPENDED USER BYPASS)
        if (profile.status !== 'active') {
            // Auto-add to blacklist for faster rejection next time
            await blacklistService.blacklistUser(uid, profile.status); // 1 hour block

            console.warn(`[AUTH] Blocked non-active user: ${uid} (${profile.status})`);
            return res.status(403).json({
                error: 'Account not active',
                code: 'AUTH_ACCOUNT_INACTIVE',
                status: profile.status
            });
        }

        // STEP 6: Validate Role Exists
        if (!['MD', 'EMPLOYEE'].includes(profile.role)) {
            console.warn(`[AUTH] Invalid role for ${uid}: ${profile.role}`);
            return res.status(403).json({ error: 'Invalid role assignment', code: 'AUTH_INVALID_ROLE' });
        }

        // STEP 7: Attach Context
        req.user = {
            uid: uid,
            email: decodedToken.email,
            role: profile.role,
            status: profile.status,
            profile: profile
        };

        next();

    } catch (error) {
        // FAIL CLOSED
        console.error('[AUTH CRITICAL] Auth middleware error:', error);
        await auditLogger.logSecurityEvent({
            action: 'auth_middleware_fail',
            error: error.message
        });
        return res.status(500).json({ error: 'Authentication service error' });
    }
};

module.exports = authenticateAndAuthorize;
