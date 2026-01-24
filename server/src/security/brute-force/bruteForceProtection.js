/**
 * PURPOSE: Protect authentication endpoints from brute force attacks
 * SECURITY: Account lockout + progressive delays
 * SCOPE: Tracks failed login attempts per user + IP combination
 */
const { db } = require('../../../config/firebase');
const auditLogger = require('../../auth/audit/auditLogger');
const ipBlacklistService = require('../ddos-protection/ipBlacklistService');

class BruteForceProtector {
    constructor() {
        // In-memory tracker for speed (User+IP)
        this.failedAttempts = new Map(); // key -> { count, lockedUntil }
        this.LOCK_THRESHOLDS = [
            { count: 5, delay: 60 * 1000 }, // 1 min
            { count: 10, delay: 5 * 60 * 1000 }, // 5 min
            { count: 15, delay: 30 * 60 * 1000 }, // 30 min
        ];
        this.IP_BLOCK_THRESHOLD = 20;
    }

    _getKey(username, ip) {
        return `${username}:${ip}`;
    }

    /**
     * Check if login should be allowed
     * @returns {Object} { allowed: boolean, delay: number, reason: string }
     */
    async checkLoginAllowed(username, ip) {
        const key = this._getKey(username, ip);
        const record = this.failedAttempts.get(key);

        if (!record) return { allowed: true };

        if (record.lockedUntil > Date.now()) {
            const waitTime = Math.ceil((record.lockedUntil - Date.now()) / 1000);
            return {
                allowed: false,
                delay: waitTime,
                reason: `Too many failed attempts. Try again in ${waitTime} seconds.`
            };
        }

        return { allowed: true };
    }

    /**
     * Record a failed attempt
     */
    async recordFailedAttempt(username, ip) {
        const key = this._getKey(username, ip);
        let record = this.failedAttempts.get(key) || { count: 0, lockedUntil: 0 };

        record.count++;
        record.lastAttempt = Date.now();

        // Calculate lockout
        let lockoutDuration = 0;
        for (const threshold of this.LOCK_THRESHOLDS) {
            if (record.count >= threshold.count) {
                lockoutDuration = threshold.delay;
            }
        }

        if (lockoutDuration > 0) {
            record.lockedUntil = Date.now() + lockoutDuration;

            await auditLogger.logSecurityEvent({
                action: 'account_temp_lockout',
                username,
                ip,
                attempts: record.count,
                duration: lockoutDuration
            });
        }

        // IP Block check
        if (record.count >= this.IP_BLOCK_THRESHOLD) {
            await ipBlacklistService.blacklistIP(ip, 'brute_force_excessive', 24 * 60 * 60 * 1000);
        }

        this.failedAttempts.set(key, record);
    }

    /**
     * Reset on success
     */
    async recordSuccessfulLogin(username, ip) {
        const key = this._getKey(username, ip);
        this.failedAttempts.delete(key);
    }
}

module.exports = new BruteForceProtector();
