/**
 * PURPOSE: Comprehensive audit trail for ALL auth events
 * SECURITY: Enables incident response and forensics
 * COMPLIANCE: Supports regulatory requirements
 */
const { db } = require('../../../config/firebase'); // Adjust path as needed
const admin = require('firebase-admin');

class AuditLogger {
    constructor() {
        this.collection = 'audit';
    }

    async _log(type, event) {
        try {
            const entry = {
                timestamp: admin.database.ServerValue.TIMESTAMP,
                eventType: type,
                ...event
            };

            // Push to Realtime Database
            await db.ref(this.collection).push(entry);

            // Console log for immediate visibility in dev/render logs
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[AUDIT] [${type}]`, JSON.stringify(event));
            }
        } catch (error) {
            console.error('[AUDIT ERROR] Failed to write log:', error);
            // Fallback: Ensure we at least have a server log
            console.error(`[AUDIT FALLBACK] [${type}]`, JSON.stringify(event));
        }
    }

    /**
     * Log authentication events
     * Includes: login, logout, token refresh, failures
     */
    async logAuthEvent(event) {
        await this._log('auth_event', event);
    }

    /**
     * Log authorization events
     * Includes: role changes, permission grants/denials
     */
    async logAuthzEvent(event) {
        await this._log('authz_event', event);
    }

    /**
     * Log security events
     * Includes: blacklist additions, token revocations, suspicious activity
     */
    async logSecurityEvent(event) {
        await this._log('security_event', event);
    }
}

module.exports = new AuditLogger();
