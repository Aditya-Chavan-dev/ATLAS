/**
 * PURPOSE: Remove legacy auth code and data
 * SECURITY: Only runs after successful migration verification
 * SCOPE: Deletes users node
 * WARNING: DESTRUCTIVE ACTION
 */
const { db } = require('../../config/firebase');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function cleanupLegacy() {
    console.log('⚠️  WARNING: This will PERMANENTLY DELETE the "users" node.');

    rl.question('Are you sure you have backed up the data? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() !== 'yes') {
            console.log('Aborting cleanup.');
            process.exit(0);
        }

        try {
            console.log('🗑️  Deleting legacy "users" node...');
            await db.ref('users').remove();
            console.log('✅ Cleanup complete. "users" node deleted.');
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
        }

        process.exit(0);
    });
}

cleanupLegacy();
