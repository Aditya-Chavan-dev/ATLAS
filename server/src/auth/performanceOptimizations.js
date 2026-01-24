/**
 * PURPOSE: Performance enhancements for auth system
 * TARGETS:
 * - Auth latency < 100ms p95
 * - Blacklist check < 1ms
 * - Role lookup < 10ms
 */

class AuthPerformanceOptimizer {
    constructor() {
        this.tokenCache = new Map();
        this.roleCache = new Map();

        // TTL Config
        this.TOKEN_TTL = 30 * 1000; // 30 seconds (Short to respect revocation)
        this.ROLE_TTL = 60 * 1000;  // 1 minute

        // Cleanup interval
        setInterval(() => this._cleanup(), 60000);
    }

    /**
     * Get cached token verification result
     */
    getCachedToken(tokenString) {
        const cached = this.tokenCache.get(tokenString);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data;
        }
        return null;
    }

    /**
     * Cache token result
     */
    cacheToken(tokenString, decodedToken) {
        this.tokenCache.set(tokenString, {
            data: decodedToken,
            expiresAt: Date.now() + this.TOKEN_TTL
        });
    }

    /**
     * Get cached role
     */
    getCachedRole(uid) {
        const cached = this.roleCache.get(uid);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.role;
        }
        return null;
    }

    /**
     * Cache role
     */
    cacheRole(uid, role) {
        this.roleCache.set(uid, {
            role: role,
            expiresAt: Date.now() + this.ROLE_TTL
        });
    }

    /**
     * Invalidate role cache (e.g. on role change)
     */
    invalidateRole(uid) {
        this.roleCache.delete(uid);
    }

    _cleanup() {
        const now = Date.now();
        for (const [k, v] of this.tokenCache) {
            if (v.expiresAt < now) this.tokenCache.delete(k);
        }
        for (const [k, v] of this.roleCache) {
            if (v.expiresAt < now) this.roleCache.delete(k);
        }
    }
}

module.exports = new AuthPerformanceOptimizer();
