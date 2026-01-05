/**
 * Database Migration Script
 * Migrates from old /users + /attendance structure to new /employees structure
 * 
 * OLD STRUCTURE:
 * /users/{uid} - user profiles
 * /attendance/{recordId} - flat attendance records
 * 
 * NEW STRUCTURE:
 * /employees/{uid}
 *   - profile fields (name, email, phone, role, etc.)
 *   /attendance/{date} - nested attendance by date
 * 
 * Run this in Firebase console OR as a Node.js script after deployment
 */

// For Firebase Console - paste this in browser console while on Firebase Console
// Or run as Node.js script with firebase-admin SDK

const migrationScript = `
// Firebase Realtime Database Migration Script
// Run this once after deploying the new code

async function migrateDatabase() {
    console.log('🚀 Starting database migration...');
    
    // Step 1: Read all existing users
    const usersSnapshot = await firebase.database().ref('users').once('value');
    const users = usersSnapshot.val() || {};
    console.log(\`📋 Found \${Object.keys(users).length} users\`);
    
    // Step 2: Read all existing attendance
    const attendanceSnapshot = await firebase.database().ref('attendance').once('value');
    const attendance = attendanceSnapshot.val() || {};
    console.log(\`📋 Found \${Object.keys(attendance).length} attendance records\`);
    
    // Step 3: Migrate each user to /employees
    let migratedUsers = 0;
    let migratedAttendance = 0;
    
    for (const [uid, userData] of Object.entries(users)) {
        // Create employee record
        const employeeData = {
            name: userData.name,
            email: userData.email,
            phone: userData.phone || '',
            role: userData.role,
            fcmToken: userData.fcmToken || null,
            photoURL: userData.photoURL || '',
            createdAt: userData.createdAt || new Date().toISOString()
        };
        
        // Find all attendance for this user
        const userAttendance = {};
        for (const [recordId, record] of Object.entries(attendance)) {
            if (record.employeeId === uid || record.employeeEmail === userData.email) {
                const date = record.date;
                if (date) {
                    userAttendance[date] = {
                        location: record.location,
                        siteName: record.siteName || '',
                        status: record.status,
                        timestamp: record.timestamp,
                        submittedAt: record.submittedAt,
                        employeeName: record.employeeName,
                        employeeEmail: record.employeeEmail,
                        employeeId: uid,
                        // Preserve approval data
                        approvedAt: record.approvedAt || null,
                        rejectedAt: record.rejectedAt || null,
                        handledBy: record.handledBy || null,
                        mdReason: record.mdReason || null
                    };
                    migratedAttendance++;
                }
            }
        }
        
        // Add attendance to employee data
        if (Object.keys(userAttendance).length > 0) {
            employeeData.attendance = userAttendance;
        }
        
        // Write to /employees
        await firebase.database().ref(\`employees/\${uid}\`).set(employeeData);
        migratedUsers++;
        console.log(\`✅ Migrated user: \${userData.email}\`);
    }
    
    console.log('');
    console.log('=== Migration Complete ===');
    console.log(\`👥 Migrated \${migratedUsers} users\`);
    console.log(\`📊 Migrated \${migratedAttendance} attendance records\`);
    console.log('');
    console.log('⚠️  IMPORTANT: The old /users and /attendance data has NOT been deleted.');
    console.log('⚠️  Verify the migration is correct, then manually delete old paths if desired.');
}

// Run the migration
migrateDatabase().catch(console.error);
`;

console.log('=== DATABASE MIGRATION SCRIPT ===');
console.log('');
console.log('Run this script in one of the following ways:');
console.log('');
console.log('1. Firebase Console (Browser):');
console.log('   - Open your Firebase Console');
console.log('   - Go to Realtime Database');
console.log('   - Open browser DevTools console');
console.log('   - Paste and run the script below');
console.log('');
console.log('2. Node.js with firebase-admin:');
console.log('   - Modify the script to use firebase-admin SDK');
console.log('   - Run with: node migration.js');
console.log('');
console.log('='.repeat(50));
console.log(migrationScript);
console.log('='.repeat(50));
