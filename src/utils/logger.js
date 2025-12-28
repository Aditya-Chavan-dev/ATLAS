/**
 * ATLAS Logger Utility
 * Environment-aware logging that silences verbose logs in production.
 * 
 * FAANG Principle: "Logs should be useful, not noise."
 */

import { config } from '../config';

const isDev = config.isDev

const getTimestamp = () => new Date().toISOString() // Internal usage allowed here to avoid circular dep with Time utils if we used it

const logger = {
    /**
     * Info logs - Only shown in development
     */
    info: (msg, ...args) => {
        if (isDev) {
            console.log(`%c[INFO] ${getTimestamp()}: ${msg}`, 'color: #3b82f6', ...args)
        }
    },

    /**
     * Debug logs - Only shown in development
     */
    debug: (msg, ...args) => {
        if (isDev) {
            console.log(`%c[DEBUG] ${getTimestamp()}: ${msg}`, 'color: #a855f7', ...args)
        }
    },

    /**
     * Warning logs - Always shown
     */
    warn: (msg, ...args) => {
        console.warn(`[WARN] ${getTimestamp()}: ${msg}`, ...args)
    },

    /**
     * Error logs - Always shown
     */
    error: (msg, ...args) => {
        console.error(`[ERROR] ${getTimestamp()}: ${msg}`, ...args)
    },

    /**
     * Critical logs - Always shown, for system-critical issues
     */
    critical: (msg, ...args) => {
        console.error(`%c[CRITICAL] ${getTimestamp()}: ${msg}`, 'background: red; color: white; padding: 2px 5px; border-radius: 3px;', ...args)
        // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
    }
}

export default logger
