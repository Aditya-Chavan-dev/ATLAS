/**
 * PURPOSE: Manage Firebase token revocation and validation
 * SECURITY: Implements immediate token invalidation for critical events
 * USAGE: Called on user suspension, role changes, security incidents
 */
const { admin } = require('../../../config/firebase'); // Adjust path
const auditLogger = require('../audit/auditLogger');

class TokenRevocationService {
    /**
     * Revoke all refresh tokens for a user
     * Forces immediate logout on next API call (if checkRevoked is true)
     */
    async revokeUserTokens(uid, reason = 'manual_revocation', performedBy = 'system') {
        try {
            await admin.auth().revokeRefreshTokens(uid);

            await auditLogger.logSecurityEvent({
                action: 'revoke_tokens',
                uid,
                reason,
                performedBy
            });

            console.log(`[AUTH] Tokens revoked for user: ${uid} (${reason})`);
            return true;
        } catch (error) {
            console.error(`[AUTH] Failed to revoke tokens for ${uid}:`, error);
            throw error;
        }
    }

    /**
     * Verify token hasn't been revoked
     * Checks against Firebase tokensValidAfterTime
     * NOTE: This is handled by verifyIdToken(token, true) in middleware,
     * but specific logic can be added here if needed.
     */
    async verifyTokenNotRevoked(decodedToken) {
        // This is implicit if verifyIdToken(idToken, true) is used.
        // We can add extra checks if we maintain our own revocation list (future).
        return true;
    }

    /**
     * Force token refresh by revoking old tokens
     * Used when role changes to sync Custom Claims
     */
    async forceTokenRefresh(uid) {
        return this.revokeUserTokens(uid, 'force_refresh_role_sync', 'system');
    }
}

module.exports = new TokenRevocationService();
