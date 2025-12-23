const { db } = require('../config/firebase');

// In-memory storage
let cachedTokens = null;
let cachedEmployees = null;
let lastTokenFetch = 0;
let lastEmployeeFetch = 0;

// Cache Duration (5 Minutes)
const CACHE_TTL = 5 * 60 * 1000;

const TokenCacheService = {
    /**
     * Get Device Tokens (from Cache or DB)
     */
    async getTokens() {
        const now = Date.now();
        if (!cachedTokens || (now - lastTokenFetch > CACHE_TTL)) {
            console.log('🔄 [Cache] Fetching Device Tokens from Firebase...');
            const snap = await db.ref('deviceTokens').once('value');
            cachedTokens = snap.val() || {};
            lastTokenFetch = now;
            console.log(`✅ [Cache] Loaded ${Object.keys(cachedTokens).length} tokens.`);
        } else {
            console.log('⚡ [Cache] Serving Tokens from Memory');
        }
        return cachedTokens;
    },

    /**
     * Get Employees (from Cache or DB)
     * Used only for "Notification Settings" checks (Name, Role, Email)
     */
    async getEmployees() {
        const now = Date.now();
        if (!cachedEmployees || (now - lastEmployeeFetch > CACHE_TTL)) {
            console.log('🔄 [Cache] Fetching Employees from Firebase...');
            const snap = await db.ref('employees').once('value');
            cachedEmployees = snap.val() || {};
            lastEmployeeFetch = now;
            console.log(`✅ [Cache] Loaded ${Object.keys(cachedEmployees).length} employees.`);
        } else {
            console.log('⚡ [Cache] Serving Employees from Memory');
        }
        return cachedEmployees;
    },

    /**
     * Reactive Update: Add/Update Token (Fast Path)
     * Called when a device registers.
     */
    updateToken(token, data) {
        if (cachedTokens) {
            cachedTokens[token] = data;
            console.log(`⚡ [Cache] Updated token: ${token.substring(0, 10)}...`);
        }
    },

    /**
     * Reactive Remove: Remove Token
     */
    removeToken(token) {
        if (cachedTokens && cachedTokens[token]) {
            delete cachedTokens[token];
            console.log(`⚡ [Cache] Removed token: ${token.substring(0, 10)}...`);
        }
    },

    /**
     * Warm Up Cache (Called on Server Start/Wage)
     */
    async warmUp() {
        console.log('🔥 [Cache] Warming up...');
        try {
            await Promise.all([this.getTokens(), this.getEmployees()]);
            console.log('🔥 [Cache] Ready!');
        } catch (error) {
            console.error('❌ [Cache] Warmup Failed:', error);
        }
    }
};

module.exports = TokenCacheService;
