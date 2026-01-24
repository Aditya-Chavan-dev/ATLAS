/**
 * PURPOSE: Remove legacy auth code and data dependencies
 * WARNING: This deletes source files. Run with caution.
 */
const fs = require('fs');
const path = require('path');

const FILES_TO_DELETE = [
    '../../../middleware/authMiddleware.js', // Old middleware
    // Add other legacy paths here relative to this script
];

function removeLegacyFiles() {
    console.log('🗑️  Starting Legacy Code Removal...');

    let deletedCount = 0;

    FILES_TO_DELETE.forEach(relativePath => {
        const fullPath = path.join(__dirname, relativePath);
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
                console.log(`✅ Deleted: ${fullPath}`);
                deletedCount++;
            } catch (err) {
                console.error(`❌ Failed to delete ${fullPath}:`, err.message);
            }
        } else {
            console.log(`ℹ️  Skipped (Not Found): ${fullPath}`);
        }
    });

    console.log(`Cleanup Complete. Removed ${deletedCount} files.`);
}

removeLegacyFiles();
