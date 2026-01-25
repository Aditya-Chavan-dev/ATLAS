import { pool } from '../config/database';

export type AuditEventType =
    | 'auth_missing_token'
    | 'auth_invalid_token'
    | 'auth_missing_email'
    | 'auth_unverified_email'
    | 'auth_granted'
    | 'auth_denied'
    | 'auth_uid_mismatch'
    | 'auth_error'
    | 'user_pending_created'
    | 'user_pending_expired'
    | 'user_approved'
    | 'user_rejected'
    | 'user_activated'
    | 'user_deactivated'
    | 'user_role_changed'
    | 'user_uid_bound'
    | 'root_owner_created'
    | 'root_owner_promoted'
    | 'secondary_owner_appointed'
    | 'secondary_owner_revoked'
    | 'admin_access_denied'
    | 'admin_action_blocked';

export type AuditResult = 'granted' | 'denied';

/**
 * Appends an immutable record to the audit_logs table.
 * Guaranteed to NEVER throw an error effectively (catches internally).
 */
export const logAudit = async (
    email: string,
    eventType: AuditEventType,
    result: AuditResult,
    data?: Record<string, any>,
    req?: any // Optional express request object to extract IP/Agent
): Promise<void> => {
    try {
        const ip = req?.ip || req?.socket?.remoteAddress || 'unknown';
        const userAgent = req?.headers?.['user-agent'] || 'unknown';
        const path = req?.originalUrl || req?.url || 'unknown';
        const eventData = data ? JSON.stringify(data) : null;

        await pool.query(
            `INSERT INTO audit_logs 
       (user_email, event_type, result, event_data, ip_address, user_agent, request_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [email, eventType, result, eventData, ip, userAgent, path]
        );
    } catch (error) {
        // CRITICAL: We cannot allow audit logging failure to crash the request,
        // BUT we must verify the system is behaving.
        // In a high-security environment, you might chose to panic here.
        // For this spec, we log the failure to stderr.
        console.error('🚨 AUDIT LOGGING FAILED (CRITICAL):', error);
        console.error('   Event Details:', { email, eventType, result, data });
    }
};
