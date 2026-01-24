/**
 * PURPOSE: Express middleware for rate limiting
 * SECURITY: Uses express-rate-limit
 * PERFORMANCE: Configurable storage (Memory default, Redis optional)
 */
const rateLimit = require('express-rate-limit');
const config = require('./rateLimitConfig');
const ipBlacklistService = require('../ddos-protection/ipBlacklistService');

// Custom handler for rate limit violations
const limitHandler = async (req, res, next, options) => {
    const ip = req.ip;

    // Log violation
    console.warn(`[RATE LIMIT] IP ${ip} exceeded limit for ${req.originalUrl}`);

    // Optional: Validations for auto-blacklisting (Phase 2.3)
    // For now, just return 429
    res.status(options.statusCode).json({
        error: options.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(options.windowMs / 1000)
    });
};

/**
 * Create a limiter instance
 * @param {string} type 'global' | 'auth' | 'api' | 'mutation'
 */
const createLimiter = (type) => {
    const conf = config[type] || config.global;

    return rateLimit({
        windowMs: conf.windowMs,
        max: conf.max,
        standardHeaders: true,
        legacyHeaders: false,
        message: conf.message,
        handler: limitHandler,
        skip: (req) => {
            // Skip if IP is whitelisted (if we had a whitelist)
            // Or skip if internal service
            return false;
        },
        keyGenerator: (req) => {
            // Use IP + User ID if authenticated to prevent shared IP blocking
            // For auth endpoints, usually just IP is safer to prevent enumeration
            if (req.user && type !== 'auth') {
                return `${req.ip}_${req.user.uid}`;
            }
            return req.ip;
        }
    });
};

module.exports = {
    globalLimiter: createLimiter('global'),
    authLimiter: createLimiter('auth'),
    apiLimiter: createLimiter('api'),
    mutationLimiter: createLimiter('mutation')
};
