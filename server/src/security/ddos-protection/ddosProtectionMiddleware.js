/**
 * PURPOSE: Multi-layer DDoS mitigation
 * SECURITY: Protects against volumetric attacks
 * SCOPE: IP blocking, request size limits, timeout controls
 */
const ipBlacklistService = require('./ipBlacklistService');
const auditLogger = require('../../auth/audit/auditLogger');

// 1. IP Blacklist Check (First Line of Defense)
const checkIPBlacklist = async (req, res, next) => {
    // We check synchronous cache first for speed
    if (ipBlacklistService.isBlacklisted(req.ip)) {
        // Silent drop or 403
        // To save resources, we reject immediately
        // Note: console.warn might spam logs in a real attack, consider sampling
        return res.status(403).send(); // Send empty response to save bandwidth
    }
    next();
};

// 2. Request Size Limiter (Handled by express.json/urlencoded in app.js, but enforced here just in case)
const requestSizeLimiter = (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || 0);
    const LIMIT = 100 * 1024; // 100KB defined in config

    if (contentLength > LIMIT) {
        auditLogger.logSecurityEvent({
            action: 'ddos_request_size_blocked',
            ip: req.ip,
            size: contentLength
        });
        return res.status(413).json({ error: 'Payload too large' });
    }
    next();
};

// 3. Simple Connection/Request Throttler (Memory based for single instance)
// Tracks requests per second per IP
const requestHistory = new Map(); // ip -> [timestamp, timestamp]

const volumetricThrottler = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const WINDOW = 1000; // 1 second
    const LIMIT = 50; // Max 50 req/sec per IP (Aggressive)

    let timestamps = requestHistory.get(ip) || [];

    // Clean old timestamps
    timestamps = timestamps.filter(t => now - t < WINDOW);

    if (timestamps.length >= LIMIT) {
        // Trigger auto-blacklist for 10 minutes
        ipBlacklistService.blacklistIP(ip, 'volumetric_attack_detected', 600000);
        return res.status(429).send();
    }

    timestamps.push(now);
    requestHistory.set(ip, timestamps);

    // Cleanup map periodically to prevent memory leak (simplified)
    if (Math.random() < 0.01) { // 1% chance to cleanup
        for (const [key, val] of requestHistory.entries()) {
            if (val.length === 0 || now - val[val.length - 1] > WINDOW) {
                requestHistory.delete(key);
            }
        }
    }

    next();
};

module.exports = {
    checkIPBlacklist,
    requestSizeLimiter,
    volumetricThrottler
};
