/**
 * AUTOMATED BACKUP SCRIPT
 * Usage: node scripts/backup-db.js
 * 
 * 1. Connects to Firebase Admin
 * 2. Downloads ENTIRE database as JSON
 * 3. Saves to /backups/YYYY-MM-DD-HH-mm.json
 */

const { db } = require('../src/config/firebase');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup dir exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const runBackup = async () => {
    console.log('📦 Starting Database Backup...');
    const startTime = Date.now();

    try {
        const snapshot = await db.ref('/').once('value');
        const data = snapshot.val();

        if (!data) {
            console.warn('⚠️  Database is empty or could not be read.');
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.json`;
        const filePath = path.join(BACKUP_DIR, filename);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        const sizeMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Backup Successful!`);
        console.log(`   File: ${filename}`);
        console.log(`   Size: ${sizeMB} MB`);
        console.log(`   Time: ${duration}s`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Backup Failed:', error);
        process.exit(1);
    }
};

runBackup();
