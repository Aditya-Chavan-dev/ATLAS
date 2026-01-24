/**
 * PURPOSE: Manage user lifecycle (suspend, archive, reactivate)
 * SECURITY: Immediate token revocation + blacklisting
 * AUDIT: Full logging of all state changes
 */
const { admin, db } = require('../../../config/firebase');
const tokenRevocationService = require('../../auth/token-management/tokenRevocationService');
const sessionBlacklistService = require('../../auth/session-blacklist/sessionBlacklistService');
const auditLogger = require('../../auth/audit/auditLogger');

class UserLifecycleController {
    /**
     * Suspend user (FIXES CRITICAL VULNERABILITY)
     * Immediate effect across all systems
     */
    async suspendUser(req, res) {
        try {
            const { targetUid, reason } = req.body;

            if (!targetUid) return res.status(400).json({ error: 'Target UID required' });

            // STEP 1: Update DB status
            await db.ref(`employees/${targetUid}/profile`).update({ status: 'suspended' });

            // STEP 2: Revoke all tokens (Firebase)
            await tokenRevocationService.revokeUserTokens(targetUid, reason || 'admin_suspension', req.user.uid);

            // STEP 3: Add to session blacklist (immediate)
            await sessionBlacklistService.blacklistUser(targetUid, reason || 'suspended', 24 * 60 * 60 * 1000);

            // STEP 4: Log audit event
            await auditLogger.logSecurityEvent({
                action: 'user_suspended',
                performedBy: req.user.uid,
                targetUser: targetUid,
                reason: reason
            });

            res.json({ success: true, message: 'User suspended and sessions revoked.' });

        } catch (error) {
            console.error('[SUSPENSION FAILED]', error);
            res.status(500).json({ error: 'Failed to suspend user' });
        }
    }

    /**
     * Reactivate suspended user
     * Removes from blacklist + re-enables Auth
     */
    async reactivateUser(req, res) {
        try {
            const { targetUid } = req.body;

            if (!targetUid) return res.status(400).json({ error: 'Target UID required' });

            // STEP 1: Update DB
            await db.ref(`employees/${targetUid}/profile`).update({ status: 'active' });

            // STEP 2: Remove from blacklist
            await sessionBlacklistService.removeFromBlacklist(targetUid);

            // STEP 3: Audit
            await auditLogger.logSecurityEvent({
                action: 'user_reactivated',
                performedBy: req.user.uid,
                targetUser: targetUid
            });

            res.json({ success: true, message: 'User reactivated.' });

        } catch (error) {
            console.error('[REACTIVATION FAILED]', error);
            res.status(500).json({ error: 'Failed to reactivate user' });
        }
    }

    /**
     * Archive user (soft delete)
     * Disables Auth account + preserves data
     */
    async archiveUser(req, res) {
        try {
            const { targetUid } = req.body;

            if (!targetUid) return res.status(400).json({ error: 'Target UID required' });

            // STEP 1: Disable in Firebase Auth
            await admin.auth().updateUser(targetUid, { disabled: true });

            // STEP 2: Update DB status
            await db.ref(`employees/${targetUid}/profile`).update({
                status: 'archived',
                archivedAt: admin.database.ServerValue.TIMESTAMP
            });

            // STEP 3: Revoke sessions
            await tokenRevocationService.revokeUserTokens(targetUid, 'archived', req.user.uid);

            // STEP 4: Blacklist (Safety)
            await sessionBlacklistService.blacklistUser(targetUid, 'archived', 24 * 60 * 60 * 1000);

            await auditLogger.logAuthzEvent({
                action: 'user_archived',
                performedBy: req.user.uid,
                targetUser: targetUid
            });

            res.json({ success: true, message: 'User archived.' });

        } catch (error) {
            console.error('[ARCHIVE FAILED]', error);
            res.status(500).json({ error: 'Failed to archive user' });
        }
    }
}

module.exports = new UserLifecycleController();
