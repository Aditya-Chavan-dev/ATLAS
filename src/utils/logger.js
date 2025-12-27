/**
 * ATLAS Logger Utility
 * Environment-aware logging that silences verbose logs in production.
 * 
 * FAANG Principle: "Logs should be useful, not noise."
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'

const logger = {
    /**
     * Info logs - Only shown in development
     */
    info: (...args) => {
        if (isDev) {
            console.log('[INFO]', ...args)
        }
    },

    /**
     * Debug logs - Only shown in development
     */
    debug: (...args) => {
        if (isDev) {
            console.log('[DEBUG]', ...args)
        }
    },

    /**
     * Warning logs - Always shown
     */
    warn: (...args) => {
        console.warn('[WARN]', ...args)
    },

    /**
     * Error logs - Always shown
     */
    error: (...args) => {
        console.error('[ERROR]', ...args)
    },

    /**
     * Critical logs - Always shown, for system-critical issues
     */
    critical: (...args) => {
        console.error('[CRITICAL]', ...args)
        // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
    }
}

export default logger
