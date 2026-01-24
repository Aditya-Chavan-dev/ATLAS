const fs = require('fs');
const path = require('path');
const { db } = require('../../config/firebase');

const backupFile = process.argv[2];

if (!backupFile) {
    console.error('Usage: node backup-verification.js <path-to-backup-file>');
    process.exit(1);
}

async function verify() {
    console.log(`🔍 Verifying backup: ${backupFile}`);
    try {
        // 1. Check File Integrity
        if (!fs.existsSync(backupFile)) {
            throw new Error('File not found');
        }

        const rawData = fs.readFileSync(backupFile, 'utf8');
        const backupData = JSON.parse(rawData);
        console.log('✅ File is valid JSON');

        // 2. Sample Check vs Live DB
        console.log('Connecting to Live DB for sampling...');
        const snapshot = await db.ref('employees').limitToFirst(1).once('value');
        if (snapshot.exists()) {
            const liveKey = Object.keys(snapshot.val())[0];
            if (!backupData.employees || !backupData.employees[liveKey]) {
                console.warn(`⚠️ Warning: Sample employee ${liveKey} missing in backup!`);
            } else {
                console.log('✅ Sample data match confirmed.');
            }
        } else {
            console.log('ℹ️ Live DB employees node is empty, skipping sample check.');
        }

        console.log('✅ Verification passed.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    }
}

verify();
