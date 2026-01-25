import { pool } from '../config/database';
import { logAudit } from '../utils/auditLogger';
import { validateEnv } from '../config/validateEnv';

// Ensure env is valid if run standalone
if (require.main === module) {
    require('../config/env');
    validateEnv();
}

export const cleanupPendingUsers = async () => {
    console.log('🧹 Starting cleanup of expired pending users...');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find expired users
        const findQuery = `
      SELECT email FROM users 
      WHERE status = 'pending' 
      AND pending_expires_at < NOW()
    `;
        const res = await client.query(findQuery);

        if (res.rowCount === 0) {
            console.log('✅ No expired pending users found.');
            await client.query('ROLLBACK'); // No changes needed
            return;
        }

        console.log(`Found ${res.rowCount} expired users. Deleting...`);

        // Delete them
        const deleteQuery = `
      DELETE FROM users 
      WHERE status = 'pending' 
      AND pending_expires_at < NOW()
    `;
        await client.query(deleteQuery);

        // Log the event for each deleted user
        // We do this in a loop or batch? 
        // Spec says "Log each deletion: event_type = 'user_pending_expired'"
        // Since we don't want to spam DB with 1000 inserts if 1000 expired, 
        // but the spec demands strict audit. We will log a batch summary or individual?
        // "Log each deletion" implies individual or at least detailed log.
        // Let's log individually for strict compliance or a bulk entry if list is huge.
        // For safety and strictness, we'll log individually as per spec implication.

        // Actually, to be safe and performant, let's just log the summary for now to avoid timeout on huge cleanup,
        // OR log individual if the count is small.
        // The spec says "Log each deletion". I will iterate.

        for (const row of res.rows) {
            await logAudit(
                'SYSTEM_CLEANUP',
                'user_pending_expired',
                'denied',
                { target_email: row.email }
            );
        }

        await client.query('COMMIT');
        console.log(`✅ Successfully removed ${res.rowCount} expired users.`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Cleanup failed:', error);
        if (require.main === module) process.exit(1);
        throw error;
    } finally {
        client.release();
    }
};

// Allow standalone execution
if (require.main === module) {
    cleanupPendingUsers()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
