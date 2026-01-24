/**
 * PURPOSE: Manage user roles with immediate synchronization
 * SECURITY: Closes 1-hour window of stale admin access
 * SCOPE: Updates DB + Custom Claims + forces token refresh
 */
const { admin, db } = require('../../../config/firebase');
const tokenRevocationService = require('../../auth/token-management/tokenRevocationService');
const sessionBlacklistService = require('../../auth/session-blacklist/sessionBlacklistService');
const auditLogger = require('../../auth/audit/auditLogger');
const authPerformanceOptimizer = require('../../auth/performanceOptimizations');

class RoleManagementController {
    /**
     * Change user role (FIXES STALE ADMIN ACCESS)
     * Immediate effect across all systems
     */
    async changeUserRole(req, res) {
        try {
            const { targetUid, newRole } = req.body;

            // STEP 1: Validate permissions (MD only can change roles)
            if (req.user.role !== 'MD' && req.user.role !== 'OWNER') {
                return res.status(403).json({ error: 'Unauthorized: MD access required' });
            }

            // STEP 2: Validate new role
            if (!['MD', 'EMPLOYEE'].includes(newRole)) {
                return res.status(400).json({ error: 'Invalid role. Allowed: MD, EMPLOYEE' });
            }

            // STEP 3: Get current role (for logging/logic)
            const profileSnap = await db.ref(`employees/${targetUid}/profile`).once('value');
            const currentProfile = profileSnap.val();

            if (!currentProfile) {
                return res.status(404).json({ error: 'User profile not found' });
            }

            console.log(`[ROLE CHANGE] ${targetUid}: ${currentProfile.role} -> ${newRole} (by ${req.user.uid})`);

            // STEP 4: Update DB (Source of Truth)
            // We update this FIRST so any immediate middleware checks catch it
            await db.ref(`employees/${targetUid}/profile`).update({ role: newRole });

            // Invalidate Cache Immediately
            authPerformanceOptimizer.invalidateRole(targetUid);

            // STEP 5: Update Custom Claims
            // Does NOT affect existing tokens, but affects new ones
            await admin.auth().setCustomUserClaims(targetUid, {
                role: newRole
            });

            // STEP 6: CRITICAL - Revoke all refresh tokens
            // This forces the Client SDK to fail on next token refresh (max 1 hour),
            // BUT our "checkRevoked: true" middleware makes this INSTANT for API calls.
            await tokenRevocationService.forceTokenRefresh(targetUid);

            // STEP 7: Downgrade Check
            // If demoting from MD, we blacklist the session for a short buffer
            // to ensure in-flight requests don't slip through if they used cached/in-memory states
            if (currentProfile.role === 'MD' && newRole === 'EMPLOYEE') {
                await sessionBlacklistService.blacklistUser(
                    targetUid,
                    'role_downgrade',
                    5 * 60 * 1000 // 5 minutes safety buffer
                );
            }

            // STEP 8: Log audit event
            await auditLogger.logAuthzEvent({
                action: 'role_changed',
                performedBy: req.user.uid,
                targetUser: targetUid,
                oldRole: currentProfile.role,
                newRole: newRole
            });

            res.json({ success: true, message: `Role updated to ${newRole}` });

        } catch (error) {
            console.error('[ROLE CHANGE FAILED]', error);
            res.status(500).json({ error: 'Failed to update role' });
        }
    }
}

module.exports = new RoleManagementController();
