/**
 * PURPOSE: Migrate users in controlled batches
 * SAFETY: Pauses on errors, reports progress
 * STRATEGY: Migrate 100 users → verify → continue
 */
const { admin, db } = require('../../config/firebase');
const migrationVerification = require('./migrationVerification');

const BATCH_SIZE = 100;
const SLEEP_MS = 2000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function migrateInBatches() {
    console.log('🚀 Starting Gradual Migration...');

    try {
        const listUsersResult = await admin.auth().listUsers(10000);
        const users = listUsersResult.users;

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < users.length; i += BATCH_SIZE) {
            const batch = users.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} users)...`);

            const updates = {};

            // 1. Prepare Batch
            for (const user of batch) {
                // Check if already migrated
                const check = await migrationVerification.verifyUser(user.uid);
                if (check.success) continue;

                updates[`employees/${user.uid}/profile`] = {
                    uid: user.uid,
                    email: user.email || '',
                    name: user.displayName || 'Unknown',
                    role: 'EMPLOYEE', // Default
                    status: 'active',
                    migratedAt: admin.database.ServerValue.TIMESTAMP
                };
            }

            // 2. Commit Batch
            if (Object.keys(updates).length > 0) {
                try {
                    await db.ref().update(updates);
                    successCount += Object.keys(updates).length;
                } catch (e) {
                    console.error('❌ Batch commit failed:', e);
                    failCount += batch.length;
                    // Stop on error?
                    console.error('🛑 PAUSING MIGRATION DUE TO ERROR');
                    process.exit(1);
                }
            }

            // 3. Verification Post-Batch
            // Random sample verification
            const sampleUser = batch[0];
            const verify = await migrationVerification.verifyUser(sampleUser.uid);
            if (!verify.success) {
                console.error(`❌ Verification failed for sample user ${sampleUser.uid}:`, verify.error);
                process.exit(1);
            }

            console.log(`✅ Batch complete. Pausing for ${SLEEP_MS}ms...`);
            await sleep(SLEEP_MS);
        }

        console.log(`🏁 Migration Complete. Success: ${successCount}, Skipped/Failed: ${failCount}`);
        process.exit(0);

    } catch (error) {
        console.error('Migration Fatal Error:', error);
        process.exit(1);
    }
}

migrateInBatches();
