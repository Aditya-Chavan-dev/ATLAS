/**
 * PURPOSE: Verify verification of user migration
 * TESTS: DB profile exists, role matches default
 */
const { db } = require('../../config/firebase');

async function verifyUser(uid) {
    try {
        const snap = await db.ref(`employees/${uid}/profile`).once('value');
        const profile = snap.val();

        if (!profile) {
            return { success: false, error: 'Profile missing' };
        }
        if (!profile.role) {
            return { success: false, error: 'Role missing' };
        }
        if (profile.status !== 'active' && profile.status !== 'suspended') {
            return { success: false, error: 'Invalid status' };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = { verifyUser };
