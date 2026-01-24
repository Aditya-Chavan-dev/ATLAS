/**
 * PURPOSE: In-memory + Redis (future) session blacklist for instant revocation
 * SECURITY: Blocks suspended users immediately (fixes CRITICAL vulnerability)
 * SCOPE: Works alongside Firebase token revocation
 */
const auditLogger = require('../audit/auditLogger');

class SessionBlacklistService {
    constructor() {
        this.blacklist = new Map(); // uid -> { reason, expiresAt }
        this.CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 mins

        // Start cleanup loop
        setInterval(() => this.cleanupExpiredEntries(), this.CLEANUP_INTERVAL);
    }

    /**
     * Add user session to blacklist
     * Used when user is suspended or terminated
     * @param {string} uid 
     * @param {string} reason 
     * @param {number} durationMs Default 1 hour (max token lifetime)
     */
    async blacklistUser(uid, reason, durationMs = 3600000) {
        const expiresAt = Date.now() + durationMs;
        this.blacklist.set(uid, { reason, expiresAt });

        await auditLogger.logSecurityEvent({
            action: 'blacklist_add',
            uid,
            reason,
            expiresAt
        });

        console.log(`[BLACKLIST] User ${uid} blacklisted until ${new Date(expiresAt).toISOString()}`);
    }

    /**
     * Check if user session is blacklisted
     * Called on EVERY authenticated request
     */
    async isBlacklisted(uid) {
        const entry = this.blacklist.get(uid);
        if (!entry) return false;

        if (Date.now() > entry.expiresAt) {
            this.blacklist.delete(uid);
            return false;
        }

        return entry;
    }

    /**
     * Remove user from blacklist
     * Used when user is reactivated
     */
    async removeFromBlacklist(uid) {
        if (this.blacklist.has(uid)) {
            this.blacklist.delete(uid);
            await auditLogger.logSecurityEvent({
                action: 'blacklist_remove',
                uid
            });
            console.log(`[BLACKLIST] User ${uid} removed from blacklist`);
        }
    }

    /**
     * Auto-cleanup expired blacklist entries
     */
    async cleanupExpiredEntries() {
        const now = Date.now();
        let removedCount = 0;

        for (const [uid, entry] of this.blacklist.entries()) {
            if (now > entry.expiresAt) {
                this.blacklist.delete(uid);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            console.log(`[BLACKLIST] Cleaned up ${removedCount} expired entries`);
        }
    }
}

// Singleton instance
module.exports = new SessionBlacklistService();
