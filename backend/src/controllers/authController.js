// Auth Controller
// Handles centralized user creation via Firebase Admin SDK
const { admin, db } = require('../config/firebase');

/**
 * Create Employee (Auth + DB)
 * Step 5: "MD adds employee -> Firebase Auth user is created -> Application DB record is created"
 */
exports.createEmployee = async (req, res) => {
    try {
        const { email, name, phone, role } = req.body;

        if (!email || !name) {
            return res.status(400).json({ error: 'Email and Name are required.' });
        }

        console.log(`[Auth] Creating user: ${email}`);

        // 1. Create User in Firebase Auth
        let user;
        try {
            user = await admin.auth().createUser({
                email: email,
                emailVerified: false,
                phoneNumber: phone || undefined, // Must be E.164 if provided
                displayName: name,
                disabled: false
            });
            console.log(`[Auth] User created: ${user.uid}`);
        } catch (authError) {
            // Idempotency: If user already exists, just fetch them
            if (authError.code === 'auth/email-already-exists') {
                console.log(`[Auth] User already exists, fetching UID...`);
                user = await admin.auth().getUserByEmail(email);
            } else {
                throw authError; // Rethrow real errors (e.g. invalid phone)
            }
        }

        // 2. Create/Update DB Record (Canonical Source)
        // Step 5 Payload
        const profileData = {
            uid: user.uid,
            name: name,
            email: email,
            role: role || 'employee',
            phone: phone || '',
            active: true,
            createdAt: new Date().toISOString(),
            createdBy: 'MD_ADMIN_API'
        };

        const employeesRef = db.ref(`employees/${user.uid}`);
        await employeesRef.set(profileData);
        console.log(`[DB] Record created at employees/${user.uid}`);

        // 3. Optional: Set Custom Claim for Role
        await admin.auth().setCustomUserClaims(user.uid, { role: role || 'employee' });

        res.json({ success: true, user: profileData });

    } catch (error) {
        console.error('[Auth] Create Failed:', error);
        res.status(500).json({ error: error.message });
    }
};
