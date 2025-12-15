/**
 * Database Migration Script (Node.js)
 * Run from backend folder: node src/scripts/migrate.js
 * 
 * Migrates from old /users + /attendance structure to new /employees structure
 */

require('dotenv').config();
const { db } = require('../config/firebase');

async function migrateDatabase() {
    console.log('🚀 Starting database migration...');
    console.log('');

    try {
        // Step 1: Read all existing users
        console.log('📖 Reading existing /users data...');
        const usersSnapshot = await db.ref('users').once('value');
        const users = usersSnapshot.val() || {};
        const userCount = Object.keys(users).length;
        console.log(`📋 Found ${userCount} users`);

        // Step 2: Read all existing attendance
        console.log('📖 Reading existing /attendance data...');
        const attendanceSnapshot = await db.ref('attendance').once('value');
        const attendance = attendanceSnapshot.val() || {};
        const attendanceCount = Object.keys(attendance).length;
        console.log(`📋 Found ${attendanceCount} attendance records`);
        console.log('');

        if (userCount === 0) {
            console.log('⚠️  No users found to migrate. Exiting.');
            process.exit(0);
        }

        // Step 3: Migrate each user to /employees
        let migratedUsers = 0;
        let migratedAttendance = 0;

        console.log('🔄 Starting migration...');
        console.log('');

        for (const [uid, userData] of Object.entries(users)) {
            // Create employee record with profile data
            const employeeData = {
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || '',
                role: userData.role || 'employee',
                fcmToken: userData.fcmToken || null,
                photoURL: userData.photoURL || '',
                createdAt: userData.createdAt || new Date().toISOString(),
                // New fields for restructuring
                employeeId: userData.employeeId || null,
                dateOfBirth: userData.dateOfBirth || null
            };

            // Find all attendance for this user
            const userAttendance = {};
            for (const [recordId, record] of Object.entries(attendance)) {
                // Match by UID or email
                if (record.employeeId === uid || record.employeeEmail === userData.email) {
                    const date = record.date;
                    if (date) {
                        userAttendance[date] = {
                            location: record.location || 'office',
                            siteName: record.siteName || '',
                            status: record.status || 'pending',
                            timestamp: record.timestamp || Date.now(),
                            submittedAt: record.submittedAt || null,
                            employeeName: record.employeeName || userData.name,
                            employeeEmail: record.employeeEmail || userData.email,
                            employeeId: uid,
                            // Preserve approval/rejection data
                            approvedAt: record.approvedAt || null,
                            rejectedAt: record.rejectedAt || null,
                            handledBy: record.handledBy || null,
                            mdReason: record.mdReason || null,
                            // Correction data
                            isCorrection: record.isCorrection || false,
                            correctionCount: record.correctionCount || 0,
                            previousLocation: record.previousLocation || null,
                            previousSiteName: record.previousSiteName || null
                        };
                        migratedAttendance++;
                    }
                }
            }

            // Add attendance to employee data if exists
            if (Object.keys(userAttendance).length > 0) {
                employeeData.attendance = userAttendance;
            }

            // Write to /employees/{uid}
            await db.ref(`employees/${uid}`).set(employeeData);
            migratedUsers++;
            console.log(`✅ Migrated: ${userData.email || uid} (${Object.keys(userAttendance).length} attendance records)`);
        }

        console.log('');
        console.log('═'.repeat(50));
        console.log('✅ MIGRATION COMPLETE');
        console.log('═'.repeat(50));
        console.log(`👥 Migrated ${migratedUsers} users to /employees`);
        console.log(`📊 Migrated ${migratedAttendance} attendance records`);
        console.log('');
        console.log('⚠️  NOTE: Old /users and /attendance data is still present.');
        console.log('⚠️  Verify the migration, then delete old paths if desired.');
        console.log('');

        process.exit(0);

    } catch (error) {
        console.error('');
        console.error('❌ MIGRATION FAILED:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run migration
migrateDatabase();
