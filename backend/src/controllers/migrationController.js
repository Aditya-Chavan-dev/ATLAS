const { admin, db } = require('../config/firebase');

exports.runMigration = async (req, res) => {
    console.log('🚀 Starting ATLAS Database Migration (Remote)...');

    // Security: Simple protection (could be improved)
    const { key } = req.body;
    if (key !== 'mig_2025_secure_start') {
        return res.status(403).json({ error: 'Unauthorized migration request' });
    }

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
            if (mergedProfile.role === 'OWNER') mergedProfile.role = 'MD'; // Normalize Owner -> MD (Roles are MD or EMPLOYEE as per prompt)

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
                            location: (record.locationType || record.workLocation || record.location || 'office').toLowerCase(),
                            markedAt: record.timestamp || record.checkInTime || record.markedAt || new Date().toISOString(),
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
            if (record.employeeId) {
                const uid = record.employeeId;
                let dateStr = record.date;
                if (dateStr && dateStr.includes('T')) dateStr = dateStr.split('T')[0];

                if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const targetAttPath = `employees/${uid}/attendance/${dateStr}`;

                    const newRecord = {
                        date: dateStr,
                        status: (record.status || 'present').toLowerCase(),
                        location: (record.locationType || record.location || 'office').toLowerCase(),
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
        const updateCount = Object.keys(updates).length;
        console.log(`💾 Writing ${updateCount} updates to database...`);

        if (updateCount > 0) {
            await db.ref().update(updates);
        }

        console.log('✅ Migration Complete.');

        res.json({
            success: true,
            message: 'Migration completed successfully',
            stats: {
                profilesMatched: authUsers.length,
                updatesPerformed: updateCount,
                log: migrationLog.slice(0, 50) // Sample log
            }
        });

    } catch (error) {
        console.error('❌ Migration Failed:', error);
        res.status(500).json({ error: error.message });
    }
};
