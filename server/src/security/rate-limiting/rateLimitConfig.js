/**
 * PURPOSE: Centralized rate limit configurations
 * SECURITY: Different limits for different endpoint types
 * MAINTAINABILITY: Easy to adjust limits without code changes
 */

const envInfo = require('../../config/environments/' + (process.env.NODE_ENV || 'production'));
const isDev = process.env.NODE_ENV === 'development';

// Base multipliers from environment config
const globalMax = envInfo?.rateLimit?.max || 1000;
const authMax = envInfo?.rateLimit?.authMax || 5;

module.exports = {
    // Global limits (apply to all requests)
    global: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: globalMax,
        message: 'Too many requests from this IP, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
    },

    // Authentication endpoints (stricter)
    auth: {
        windowMs: 15 * 60 * 1000,
        max: authMax,
        message: 'Too many login attempts, please try again later',
        skipSuccessfulRequests: false, // Count successes too to prevent enumeration timing checks? No, usually false for brute force.
    },

    // API endpoints (moderate)
    api: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: isDev ? 1000 : 60, // 60 requests per minute in prod
    },

    // Data modification endpoints (strict)
    mutation: {
        windowMs: 1 * 60 * 1000,
        max: isDev ? 1000 : 30, // 30 modifications per minute
    }
};
