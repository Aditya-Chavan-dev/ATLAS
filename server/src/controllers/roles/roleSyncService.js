/**
 * PURPOSE: Ensure role consistency across all layers
 * SECURITY: Periodic reconciliation to catch drift
 * SCOPE: Compares DB vs Custom Claims
 */
const { admin, db } = require('../../../config/firebase');

class RoleSyncService {
    /**
     * Audit single user for consistency
     */
    async checkUserConsistency(uid) {
        try {
            // 1. Get Auth Record (Claims)
            const userRecord = await admin.auth().getUser(uid);
            const claimsRole = userRecord.customClaims?.role;

            // 2. Get DB Record
            const snap = await db.ref(`employees/${uid}/profile`).once('value');
            const profile = snap.val();
            const dbRole = profile?.role;

            if (claimsRole !== dbRole) {
                console.warn(`[ROLE DRIFT] User ${uid} - Claims: ${claimsRole}, DB: ${dbRole}`);
                return { consistent: false, claimsRole, dbRole };
            }
            return { consistent: true };

        } catch (error) {
            console.error(`[ROLE SYNC] Check failed for ${uid}:`, error);
            return { error: error.message };
        }
    }

    /**
     * Force Sync DB -> Claims
     * (Source of Truth is DB)
     */
    async syncRoleFromDB(uid) {
        try {
            const snap = await db.ref(`employees/${uid}/profile`).once('value');
            const profile = snap.val();

            if (profile && profile.role) {
                await admin.auth().setCustomUserClaims(uid, { role: profile.role });
                console.log(`[ROLE SYNC] Synced ${uid} to role ${profile.role}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`[ROLE SYNC] Fix failed for ${uid}:`, error);
            return false;
        }
    }
}

module.exports = new RoleSyncService();
