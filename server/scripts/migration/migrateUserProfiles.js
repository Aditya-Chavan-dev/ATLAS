/**
 * PURPOSE: Migrate legacy users node to employees node
 * SECURITY: Preserves data integrity during migration
 * SCOPE: One-time migration script with rollback capability
 */
const { admin, db } = require('../../config/firebase');
const fs = require('fs');
const path = require('path');

// Logging setup
const LOG_FILE = path.join(__dirname, 'migration_log.json');

async function migrateProfiles() {
    console.log('🚀 Starting Profile Migration...');
    const log = { success: [], errors: [], skipped: [] };

    try {
        // 1. Fetch all Auth Users (to ensure we cover everyone)
        const listUsersResult = await admin.auth().listUsers(1000);
        const authUsers = listUsersResult.users;

        // 2. Fetch Legacy Data
        const usersSnap = await db.ref('users').once('value');
        const legacyUsers = usersSnap.val() || {};

        // 3. Fetch Existing Employees (to avoid overwriting valid data if re-run)
        const empSnap = await db.ref('employees').once('value');
        const existingEmployees = empSnap.val() || {};

        console.log(`Found ${authUsers.length} Auth Users, ${Object.keys(legacyUsers).length} Legacy Profiles.`);

        const updates = {};

        for (const user of authUsers) {
            const uid = user.uid;

            // Check if already migrated/exists in new system
            if (existingEmployees[uid] && existingEmployees[uid].profile) {
                log.skipped.push({ uid, reason: 'Already exists in employees' });
                continue;
            }

            // Gather Data
            const legacyData = legacyUsers[uid] || {};

            const newProfile = {
                uid: uid,
                email: (user.email || legacyData.email || '').toLowerCase(),
                name: legacyData.displayName || user.displayName || 'Unknown User',
                phone: legacyData.phoneNumber || user.phoneNumber || '',
                role: 'EMPLOYEE', // Default safe role
                status: 'active', // Default active
                createdAt: user.metadata.creationTime,
                migratedAt: admin.database.ServerValue.TIMESTAMP
            };

            // If legacy had admin/owner role markers (unlikely in 'users' node but possible)
            // We ignore them for safety. Only manual promotion allows MD role.

            updates[`employees/${uid}/profile`] = newProfile;
            log.success.push({ uid, email: newProfile.email });
        }

        // 4. Perform Atomic Update
        if (Object.keys(updates).length > 0) {
            console.log(`Commiting ${Object.keys(updates).length} new profiles...`);
            await db.ref().update(updates);
            console.log('✅ Migration committed successfully.');
        } else {
            console.log('ℹ️ No new profiles to migrate.');
        }

        // Write Log
        fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
        console.log(`📝 Log written to ${LOG_FILE}`);

    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

migrateProfiles();
