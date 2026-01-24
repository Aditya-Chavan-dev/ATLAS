const { db } = require('../../config/firebase');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../../../backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backup() {
    console.log('📦 Starting Firebase Backup...');
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.json`;
        const filepath = path.join(BACKUP_DIR, filename);

        console.log('Fetching data...');
        const snapshot = await db.ref().once('value');
        const data = snapshot.val();

        if (!data) {
            console.warn('⚠️ Warning: Database is empty.');
        }

        console.log(`Writing to ${filepath}...`);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

        console.log('✅ Backup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    }
}

backup();
