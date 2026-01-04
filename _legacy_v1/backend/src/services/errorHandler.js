/**
 * ATLAS CENTRALIZED ERROR HANDLER
 * STANDARDIZES ALL ERROR RESPONSES AND LOGGING
 * 
 * Fixes LEAK #16 (Error handling inconsistency)
 */

/**
 * Error Types - Semantic categorization
 */
const ErrorType = {
    VALIDATION: 'VALIDATION_ERROR',
    AUTHENTICATION: 'AUTHENTICATION_ERROR',
    AUTHORIZATION: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    EXTERNAL_SERVICE: 'EXTERNAL_SERVICE_ERROR',
    DATABASE: 'DATABASE_ERROR',
    INTERNAL: 'INTERNAL_ERROR',
};

/**
 * Application Error Class
 * Extends Error with structured metadata
 */
class AppError extends Error {
    constructor(type, message, details = {}, statusCode = 500) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.details = details;
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Create typed errors
 */
const createError = {
    validation: (message, details) =>
        new AppError(ErrorType.VALIDATION, message, details, 400),

    authentication: (message, details) =>
        new AppError(ErrorType.AUTHENTICATION, message, details, 401),

    authorization: (message, details) =>
        new AppError(ErrorType.AUTHORIZATION, message, details, 403),

    notFound: (resource, identifier) =>
        new AppError(ErrorType.NOT_FOUND, `${resource} not found`, { identifier }, 404),

    conflict: (message, details) =>
        new AppError(ErrorType.CONFLICT, message, details, 409),

    externalService: (service, originalError) =>
        new AppError(ErrorType.EXTERNAL_SERVICE, `${service} service unavailable`, { originalError: originalError.message }, 502),

    database: (operation, originalError) =>
        new AppError(ErrorType.DATABASE, `Database ${operation} failed`, { originalError: originalError.message }, 500),

    internal: (message, originalError) =>
        new AppError(ErrorType.INTERNAL, message, { originalError: originalError?.message }, 500),
};

/**
 * Structured Logger
 * Replaces console.log with consistent format
 */
const logger = {
    info: (context, message, data = {}) => {
        console.log(JSON.stringify({
            level: 'INFO',
            timestamp: new Date().toISOString(),
            context,
            message,
            ...data
        }));
    },

    error: (context, error, data = {}) => {
        console.error(JSON.stringify({
            level: 'ERROR',
            timestamp: new Date().toISOString(),
            context,
            message: error.message || error,
            stack: error.stack,
            type: error.type || 'UNKNOWN',
            ...data
        }));
    },

    warn: (context, message, data = {}) => {
        console.warn(JSON.stringify({
            level: 'WARN',
            timestamp: new Date().toISOString(),
            context,
            message,
            ...data
        }));
    },

    debug: (context, message, data = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(JSON.stringify({
                level: 'DEBUG',
                timestamp: new Date().toISOString(),
                context,
                message,
                ...data
            }));
        }
    }
};

/**
 * Express Error Handler Middleware
 * Catches all errors and formats consistently
 */
const errorHandler = (err, req, res, next) => {
    // If not an AppError, wrap it
    const error = err instanceof AppError
        ? err
        : createError.internal('Unexpected error occurred', err);

    // Log the error
    logger.error(req.path, error, {
        method: req.method,
        body: req.body,
        query: req.query,
        ip: req.ip
    });

    // Send structured response
    res.status(error.statusCode).json({
        success: false,
        error: {
            type: error.type,
            message: error.message,
            details: error.details,
            timestamp: error.timestamp,
            // Only include stack in development
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
    });
};

/**
 * Async Route Wrapper
 * Catches promise rejections automatically
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Success Response Helper
 * Standardizes success responses
 */
const sendSuccess = (res, data = {}, message = null, statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    ErrorType,
    AppError,
    createError,
    logger,
    errorHandler,
    asyncHandler,
    sendSuccess
};
