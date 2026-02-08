/**
 * ═══════════════════════════════════════════════════════════
 * FAIL-SAFE VALIDATION & AUTHORIZATION MIDDLEWARE
 * 
 * Purpose: Enforce zero-trust validation with constant-time operations
 * Security Features:
 * - Prototype pollution protection
 * - Constant-time validation (prevents timing attacks)
 * - Constant-time authorization (prevents UID enumeration)
 * - Request freezing (prevents mutation after validation)
 * - JSON depth bomb protection
 * ═══════════════════════════════════════════════════════════
 */

const { z } = require('zod');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit'); // ✅ Gap #5 fix
const { LIMITS } = require('../validation/schemas');

// ═══════════════════════════════════════════════════════════
// RATE LIMITING (Prevent validation DoS)
// Gap #5 Fix: Prevent log exhaustion via repeated failures
// ═══════════════════════════════════════════════════════════

/**
 * Rate limiter for validation endpoints
 * Prevents attackers from exhausting logs with invalid payloads
 */
const validationRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many validation attempts',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Please try again later'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    // Only count failed validations (optional enhancement)
    skip: (req) => req.validated === true,
});

// ═══════════════════════════════════════════════════════════
// PROTOTYPE POLLUTION PROTECTION
// MUST RUN BEFORE ANY JSON PARSING
// ═══════════════════════════════════════════════════════════

/**
 * Blocks prototype pollution attacks
 * Fixes: Critical vulnerability allowing object injection
 * 
 * Attack prevented:
 * {"__proto__":{"isAdmin":true}} → Would make ALL objects admins
 */
const protectAgainstPrototypePollution = (req, res, next) => {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    /**
     * Recursively check object for pollution keys
     * ✅ FIX: Throws error for immediate termination
     * @param {Object} obj - Object to check
     * @param {string} path - Current path (for logging)
     */
    const checkObject = (obj, path = '') => {
        if (!obj || typeof obj !== 'object') return;

        for (const key of Object.keys(obj)) {
            // Case-insensitive check for pollution keys
            if (dangerousKeys.includes(key.toLowerCase())) {
                // ✅ THROW instead of return for immediate halt
                throw new Error(`POLLUTION_DETECTED:${path}.${key}`);
            }

            // Recursively check nested objects
            const newPath = path ? `${path}.${key}` : key;
            checkObject(obj[key], newPath);
        }
    };

    try {
        // Check all input sources
        checkObject(req.body);
        checkObject(req.query);
        checkObject(req.params);

        next();
    } catch (error) {
        // ✅ Catch thrown pollution error
        if (error.message.startsWith('POLLUTION_DETECTED:')) {
            const pollutionPath = error.message.split(':')[1];

            console.error('[Security] Prototype pollution attempt blocked', {
                path: pollutionPath,
                ip: req.ip,
                route: req.path,
                userAgent: req.headers['user-agent']
            });

            return res.status(400).json({
                error: 'Malicious payload detected',
                code: 'PROTOTYPE_POLLUTION_BLOCKED'
            });
        }
        // Re-throw unexpected errors
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════
// ENHANCED VALIDATION MIDDLEWARE
// Constant-time operation to prevent timing attacks
// ═══════════════════════════════════════════════════════════

/**
 * Validates request data against Zod schema
 * 
 * Features:
 * - Content-Type enforcement
 * - JSON depth bomb protection
 * - Object freezing (prevents mutation)
 * - Constant-time completion
 * - Sanitized error messages (no data leakage)
 * 
 * @param {z.ZodSchema} schema - Zod validation schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => async (req, res, next) => {
    const startTime = process.hrtime.bigint();

    try {
        // ──────────────────────────────────────────────────────
        // PRE-VALIDATION SECURITY CHECKS
        // ──────────────────────────────────────────────────────

        // Check 1: Content-Type enforcement (prevent form-data bypass)
        const contentType = (req.headers['content-type'] || '').toLowerCase();
        if (req.method !== 'GET' && !contentType.includes('application/json')) {
            throw new Error('INVALID_CONTENT_TYPE');
        }

        // Check 2: JSON depth bomb protection
        if (req.body) {
            /**
             * Calculate object nesting depth
             * Prevents: {"a":{"a":{"a":...}}} 10,000 levels deep
             */
            const calculateDepth = (obj, level = 0) => {
                if (level > LIMITS.OBJECT_DEPTH) return level;
                if (obj && typeof obj === 'object') {
                    const depths = Object.values(obj).map(v =>
                        calculateDepth(v, level + 1)
                    );
                    return Math.max(level, ...depths);
                }
                return level;
            };

            const depth = calculateDepth(req.body);
            if (depth > LIMITS.OBJECT_DEPTH) {
                throw new Error('NESTED_TOO_DEEP');
            }
        }

        // ──────────────────────────────────────────────────────
        // SCHEMA VALIDATION
        // ──────────────────────────────────────────────────────

        const validatedData = {};

        if (schema.shape) {
            // Multi-part schema (body + query + params)
            if (schema.shape.body) {
                const parsed = await schema.shape.body.parseAsync(req.body || {});
                validatedData.body = Object.freeze(parsed);
                req.body = validatedData.body;
            }
            if (schema.shape.query) {
                const parsed = await schema.shape.query.parseAsync(req.query || {});
                validatedData.query = Object.freeze(parsed);
                req.query = validatedData.query;
            }
            if (schema.shape.params) {
                const parsed = await schema.shape.params.parseAsync(req.params || {});
                validatedData.params = Object.freeze(parsed);
                req.params = validatedData.params;
            }
        } else {
            // Single schema for body
            const parsed = await schema.parseAsync(req.body || {});
            validatedData.body = Object.freeze(parsed);
            req.body = validatedData.body;
        }

        // Mark request as validated (for authorization check)
        req.validated = true;
        req.validationId = crypto.randomUUID();

        // ──────────────────────────────────────────────────────
        // CONSTANT-TIME COMPLETION (Prevent timing leaks)
        // ──────────────────────────────────────────────────────

        const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1e6;
        const MIN_RESPONSE_TIME = 10; // 10ms minimum

        if (elapsedMs < MIN_RESPONSE_TIME) {
            await new Promise(resolve =>
                setTimeout(resolve, MIN_RESPONSE_TIME - elapsedMs)
            );
        }

        next();

    } catch (error) {
        // Ensure constant-time even on error
        const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1e6;
        const delay = Math.max(0, 10 - elapsedMs);

        await new Promise(resolve => setTimeout(resolve, delay));

        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
            // Sanitize errors (prevent schema structure leakage)
            const sanitizedErrors = error.errors.map(e => ({
                field: e.path.slice(-2).join('.'), // Only last 2 path segments
                message: e.message,
                // NEVER include: received value, error code, full path
            }));

            // Log for debugging (server-side only)
            console.warn('[Validation] Failed', {
                path: req.path,
                method: req.method,
                errorCount: sanitizedErrors.length,
                // Don't log: actual input values (might contain PII)
            });

            return res.status(400).json({
                error: 'Validation Failed',
                code: 'VALIDATION_ERROR',
                details: sanitizedErrors.slice(0, 10) // Max 10 errors shown
            });
        }

        // Handle custom errors
        if (error.message === 'INVALID_CONTENT_TYPE') {
            return res.status(415).json({
                error: 'Unsupported Media Type',
                code: 'INVALID_CONTENT_TYPE',
                message: 'Content-Type must be application/json'
            });
        }

        if (error.message === 'NESTED_TOO_DEEP') {
            return res.status(400).json({
                error: 'Invalid Request',
                code: 'NESTED_TOO_DEEP',
                message: 'Request structure too complex'
            });
        }

        // Generic error (fail securely)
        console.error('[Validation] System error:', error.message);
        return res.status(400).json({
            error: 'Bad Request',
            code: 'VALIDATION_SYSTEM_ERROR'
        });
    }
};

// ═══════════════════════════════════════════════════════════
// CONSTANT-TIME AUTHORIZATION MIDDLEWARE
// Prevents timing attacks revealing valid UIDs
// ═══════════════════════════════════════════════════════════

/**
 * Authorizes resource access based on ownership or role
 * 
 * Features:
 * - Constant-time string comparison (prevents UID enumeration)
 * - Enforces validation happened first
 * - Comprehensive logging
 * 
 * @param {Object} options - Authorization options
 * @param {string} options.resourceParam - Param name containing resource ID
 * @param {string[]} options.allowRoles - Roles with privileged access
 * @param {boolean} options.allowSelf - Allow user to access own resource
 * @returns {Function} Express middleware
 */
const authorize = (options = {}) => async (req, res, next) => {
    const startTime = process.hrtime.bigint();

    try {
        const {
            resourceParam = 'employeeId',
            allowRoles = ['MD', 'OWNER'],
            allowSelf = true
        } = options;

        // ──────────────────────────────────────────────────────
        // CRITICAL PRECONDITION CHECKS
        // ──────────────────────────────────────────────────────

        // Check 1: User context exists (auth middleware ran)
        if (!req.user || !req.user.uid || !req.user.role) {
            throw new Error('MISSING_AUTH');
        }

        // Check 2: Validation happened first
        if (!req.validated) {
            throw new Error('VALIDATION_REQUIRED');
        }

        // ──────────────────────────────────────────────────────
        // AUTHORIZATION LOGIC
        // ──────────────────────────────────────────────────────

        const requestedResource = req.params[resourceParam];
        const requester = req.user.uid;
        const role = String(req.user.role).toLowerCase().trim();

        /**
         * Constant-time string comparison
         * Prevents timing attacks from revealing valid UIDs
         */
        const constTimeEquals = (a, b) => {
            if (!a || !b) return false;
            if (a.length !== b.length) return false;

            try {
                return crypto.timingSafeEqual(
                    Buffer.from(a),
                    Buffer.from(b)
                );
            } catch {
                return false;
            }
        };

        // Check ownership (constant-time)
        const isOwner = allowSelf && constTimeEquals(requestedResource, requester);

        // Check privileged role (constant-time via iteration)
        const normalizedRoles = allowRoles.map(r => r.toLowerCase());
        const isPrivileged = normalizedRoles.some(r => constTimeEquals(r, role));

        // Authorization decision
        if (!isOwner && !isPrivileged) {
            throw new Error('ACCESS_DENIED');
        }

        // ──────────────────────────────────────────────────────
        // SUCCESS: Log and proceed
        // ──────────────────────────────────────────────────────

        console.info('[Authorization] Granted', {
            requester,
            resource: requestedResource,
            reason: isOwner ? 'self' : 'privileged',
            requestId: req.validationId
        });

        // Constant-time delay before proceeding
        const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1e6;
        const TARGET_TIME = 50; // 50ms target

        if (elapsedMs < TARGET_TIME) {
            await new Promise(r =>
                setTimeout(r, TARGET_TIME - elapsedMs)
            );
        }

        next();

    } catch (error) {
        // ──────────────────────────────────────────────────────
        // ERROR: Ensure constant-time denial
        // ──────────────────────────────────────────────────────

        const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1e6;
        const delay = Math.max(0, 50 - elapsedMs);

        await new Promise(r => setTimeout(r, delay));

        // Log security event
        console.warn('[Authorization] Denied', {
            reason: error.message,
            path: req.path,
            ip: req.ip
        });

        // Generic denial (don't reveal why)
        return res.status(403).json({
            error: 'Access Denied',
            code: 'AUTHORIZATION_ERROR',
            message: 'You do not have permission to access this resource'
        });
    }
};

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

module.exports = {
    validate,
    authorize,
    protectAgainstPrototypePollution,
    validationRateLimiter, // ✅ Gap #5 fix
};
