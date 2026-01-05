/**
 * Standard Application Error
 * 
 * Provides a consistent structure for error handling across the app.
 * Used by Services to throw normalized errors to the UI.
 */
export class AppError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', originalError = null) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString(); // Internal use ok
    }

    /**
     * Log this error using the canonical logger
     * @param {Object} logger - The logger instance
     */
    log(logger) {
        logger.error(`[${this.code}] ${this.message}`, {
            original: this.originalError,
            stack: this.stack
        });
    }

    /**
     * Convert to user-friendly object for Toasts
     */
    toToast() {
        return {
            type: 'error',
            message: this.message
        };
    }
}

export const ERROR_CODES = {
    AUTH_FAILED: 'AUTH_FAILED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};
