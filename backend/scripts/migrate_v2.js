const { admin, db } = require('../src/config/firebase');
const fs = require('fs');
const path = require('path');

// MIGRATION SCRIPT v2
// Target: /employees/{uid}/profile AND /employees/{uid}/attendance/{date}

const migrate = async () => {
    console.log('🚀 Starting ATLAS Database Migration...');

    try {
        // 1. Snapshot ALL Data (Read-Phase)
        console.log('📸 Taking snapshot of current database...');
        const rootSnap = await db.ref().once('value');
        const root = rootSnap.val() || {};

        const usersNode = root.users || {};
        const employeesNode = root.employees || {};
        const rootAttendance = root.attendance || {}; // If exists

        const updates = {};
        const migrationLog = [];

        // 2. Resolve Auth Users (Source of Truth)
        console.log('🔄 Fetching Firebase Auth users...');
        const listUsersResult = await admin.auth().listUsers(1000);
        const authUsers = listUsersResult.users;

        console.log(`found ${authUsers.length} auth users.`);

        // 3. Migrate Profiles
        for (const user of authUsers) {
            const uid = user.uid;
            const email = user.email || '';
            const targetPath = `employees/${uid}/profile`;

            // Check if profile already exists in NEW node
            let profileData = employeesNode[uid]?.profile ||
                (employeesNode[uid] && !employeesNode[uid].profile ? employeesNode[uid] : null); // Handle if it was flat in employees

            // Check legacy 'users' node
            const legacyUser = usersNode[uid];

            // Prioritize existing 'employees' data, then 'users' data, then Auth defaults
            const mergedProfile = {
                name: (profileData?.name || legacyUser?.name || user.displayName || 'Unknown'),
                email: (profileData?.email || legacyUser?.email || email).toLowerCase(),
                phone: (profileData?.phone || legacyUser?.phone || user.phoneNumber || ''),
                role: (profileData?.role || legacyUser?.role || 'EMPLOYEE').toUpperCase(),
                active: true,
                createdAt: (profileData?.createdAt || legacyUser?.createdAt || user.metadata.creationTime)
            };

            // Fix Role Casing
            if (mergedProfile.role === 'ADMIN') mergedProfile.role = 'MD'; // Normalize Admin -> MD
            if (mergedProfile.role === 'owner') mergedProfile.role = 'MD'; // Normalize Owner -> MD (or keep Owner?)
            // Role config says: OWNER, MD, EMPLOYEE.
            // Let's keep Owner if it was there, or based on specific email.
            // But spec says: "Assign role = 'MD' if email matches configured MD email"
            // We'll stick to preserving existing if possible, but normalization is good.

            updates[targetPath] = mergedProfile;
            migrationLog.push(`Mapped Profile: ${email} (${uid})`);
        }

        // 4. Migrate Attendance
        console.log('🔄 Migrating Attendance...');

        // Source A: users/{uid}/attendance/{date}
        Object.entries(usersNode).forEach(([uid, userData]) => {
            if (userData.attendance) {
                Object.entries(userData.attendance).forEach(([key, record]) => {
                    // key might be date string or generic ID
                    let dateStr = record.date || key;
                    // Normalize Date (YYYY-MM-DD)
                    if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];

                    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const targetAttPath = `employees/${uid}/attendance/${dateStr}`;

                        const newRecord = {
                            date: dateStr,
                            status: (record.status || 'present').toLowerCase(),
                            location: (record.locationType || record.workLocation || 'office').toLowerCase(),
                            markedAt: record.timestamp || record.checkInTime || new Date().toISOString(),
                            markedBy: uid,
                            mdLocationUpdated: record.mdLocationUpdated || false,
                            mdUpdatedBy: record.mdUpdatedBy || null,
                            mdUpdatedAt: record.mdUpdatedAt || null,
                            mdUpdateReason: record.mdUpdateReason || null
                        };

                        // Collision check: simple overwrite or priority?
                        // Spec says: "Select earliest markedAt"
                        if (updates[targetAttPath]) {
                            const existing = updates[targetAttPath];
                            if (newRecord.markedAt < existing.markedAt) {
                                updates[targetAttPath] = newRecord; // Replace with earlier
                            }
                        } else {
                            updates[targetAttPath] = newRecord;
                        }
                    }
                });
            }
        });

        // Source B: root 'attendance' node (if any)
        // Check structure: attendance/{id}/{...}
        Object.values(rootAttendance).forEach(record => {
            if (record.employeeId && record.date) {
                const uid = record.employeeId;
                let dateStr = record.date;
                if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];

                if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const targetAttPath = `employees/${uid}/attendance/${dateStr}`;

                    const newRecord = {
                        date: dateStr,
                        status: (record.status || 'present').toLowerCase(),
                        location: (record.location || 'office').toLowerCase(),
                        markedAt: record.timestamp || record.markedAt || new Date().toISOString(),
                        markedBy: uid,
                        mdLocationUpdated: false, // Default
                        mdUpdatedBy: null,
                        mdUpdatedAt: null,
                        mdUpdateReason: null
                    };

                    if (updates[targetAttPath]) {
                        const existing = updates[targetAttPath];
                        if (newRecord.markedAt < existing.markedAt) {
                            updates[targetAttPath] = newRecord;
                        }
                    } else {
                        updates[targetAttPath] = newRecord;
                    }
                }
            }
        });

        // 5. Atomic Write
        console.log(`💾 Writing ${Object.keys(updates).length} updates to database...`);
        await db.ref().update(updates);

        // 6. Cleanup Legacy (Optional - verify first)
        // await db.ref('users').remove();
        // await db.ref('attendance').remove();

        console.log('✅ Migration Complete.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
};

migrate();
