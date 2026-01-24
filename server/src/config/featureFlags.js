/**
 * PURPOSE: Control new auth system rollout
 * SCOPE: Enable/disable features per user or globally
 * SAFETY: Instant rollback capability
 */
const { db } = require('../../config/firebase');

class FeatureFlagService {
    constructor() {
        this.cache = {};
        this.CACHE_TTL = 60 * 1000; // 1 minute
        this.lastFetch = 0;
    }

    async _getFlags() {
        if (Date.now() - this.lastFetch < this.CACHE_TTL && this.cache.flags) {
            return this.cache.flags;
        }

        try {
            const snap = await db.ref('config/featureFlags').once('value');
            this.cache.flags = snap.val() || {
                NEW_AUTH_ENABLED: false,
                ROLLOUT_PERCENTAGE: 0
            };
            this.lastFetch = Date.now();
            return this.cache.flags;
        } catch (error) {
            console.error('Failed to fetch feature flags:', error);
            return { NEW_AUTH_ENABLED: false, ROLLOUT_PERCENTAGE: 0 }; // Default safe
        }
    }

    /**
     * Check if new auth enabled for user
     */
    async isNewAuthEnabled(uid) {
        const flags = await this._getFlags();

        if (!flags.NEW_AUTH_ENABLED) return false;

        // If user specific override exists (e.g. whitelist for beta testers)
        if (flags.BETA_USERS && flags.BETA_USERS[uid]) return true;

        // Percentage Rollout
        // Simple hash-based percentage check to ensure stability per user
        const hash = this._simpleHash(uid);
        return (hash % 100) < flags.ROLLOUT_PERCENTAGE;
    }

    _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Emergency kill switch
     * Instant rollback to old auth
     */
    async disableNewAuth() {
        await db.ref('config/featureFlags').update({
            NEW_AUTH_ENABLED: false,
            ROLLOUT_PERCENTAGE: 0
        });
        this.cache.flags = null; // Invalidate cache
        console.warn('🚨 [FEATURE FLAGS] EMERGENCY STOP ACTIVATED');
    }
}

module.exports = new FeatureFlagService();
