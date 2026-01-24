/**
 * PURPOSE: Automated IP blacklisting for malicious actors
 * SECURITY: Blocks repeat offenders permanently
 * SCOPE: Tracks failed auth, rate limit violations, suspicious patterns
 */
const { db } = require('../../../config/firebase'); // Adjust path
const auditLogger = require('../../auth/audit/auditLogger');

class IPBlacklistService {
    constructor() {
        this.cache = new Set(); // In-memory cache for speed
        this.collection = 'ipBlacklist';
        this.syncInterval = 5 * 60 * 1000; // Sync every 5 mins

        // Initial sync
        this._syncCache();
        setInterval(() => this._syncCache(), this.syncInterval);
    }

    /**
     * Add IP to blacklist
     * Triggered by security violations
     * @param {string} ip 
     * @param {string} reason 
     * @param {number} durationMs Default 24 hours
     */
    async blacklistIP(ip, reason, durationMs = 86400000) {
        if (this.cache.has(ip)) return; // Already blocked

        try {
            // Sanitize IP (replace dots for firebase keys if storing as key, or hash it)
            // Simple approach: Use a safe key or just push to list with query
            // Here we'll use a sanitized string if IPv4, or hash for IPv6
            const safeIp = ip.replace(/\./g, '_').replace(/:/g, '__');

            const entry = {
                ip,
                reason,
                blacklistedAt: Date.now(),
                expiresAt: Date.now() + durationMs
            };

            await db.ref(`${this.collection}/${safeIp}`).set(entry);
            this.cache.add(ip);

            await auditLogger.logSecurityEvent({
                action: 'ip_blacklist_add',
                ip,
                reason,
                expiresAt: entry.expiresAt
            });

            console.warn(`[SECURITY] Blacklisted IP: ${ip} (${reason})`);
        } catch (error) {
            console.error('[SECURITY] Failed to blacklist IP:', error);
        }
    }

    /**
     * Check if IP is blacklisted
     * Called early in request pipeline
     */
    isBlacklisted(ip) {
        return this.cache.has(ip);
    }

    /**
     * Sync in-memory cache with DB
     */
    async _syncCache() {
        try {
            const snapshot = await db.ref(this.collection).once('value');
            if (!snapshot.exists()) {
                this.cache.clear();
                return;
            }

            const data = snapshot.val();
            const now = Date.now();
            const newCache = new Set();
            const updates = {};

            Object.entries(data).forEach(([key, entry]) => {
                if (entry.expiresAt > now) {
                    newCache.add(entry.ip);
                } else {
                    // Expired, mark for deletion
                    updates[key] = null;
                }
            });

            // Update cache
            this.cache = newCache;

            // Cleanup expired in DB
            if (Object.keys(updates).length > 0) {
                await db.ref(this.collection).update(updates);
                console.log(`[SECURITY] Cleaned up ${Object.keys(updates).length} expired IP bans`);
            }
        } catch (error) {
            console.error('[SECURITY] IP Blacklist sync failed:', error);
        }
    }
}

module.exports = new IPBlacklistService();
