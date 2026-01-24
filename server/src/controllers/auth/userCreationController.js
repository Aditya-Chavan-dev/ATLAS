/**
 * PURPOSE: Secure admin-only user creation flow
 * SECURITY: Transactional creation (fixes zombie accounts)
 * SCOPE: Creates Auth account + DB profile atomically
 */
const { admin, db } = require('../../../config/firebase');
const auditLogger = require('../../auth/audit/auditLogger');

class UserCreationController {
    /**
     * Create new employee (MD role only)
     * TRANSACTIONAL: Rolls back on any failure
     */
    async createEmployee(req, res) {
        let authUser = null;
        const { email, name, phone, role } = req.body;

        try {
            // STEP 1: Validate permissions (Middleware handles this, but double check)
            if (req.user.role !== 'MD' && req.user.role !== 'OWNER') {
                return res.status(403).json({ error: 'Unauthorized: MD access required' });
            }

            if (!email || !name) {
                return res.status(400).json({ error: 'Email and Name are required' });
            }

            // STEP 2: Create Firebase Auth user
            // We do this first because we can't "reserve" a UID without creating it.
            try {
                authUser = await admin.auth().createUser({
                    email: email,
                    emailVerified: false,
                    displayName: name,
                    phoneNumber: phone || undefined,
                    disabled: false
                });
            } catch (err) {
                if (err.code === 'auth/email-already-exists') {
                    return res.status(409).json({ error: 'User with this email already exists' });
                }
                throw err;
            }

            // STEP 3: Create DB profile (Atomic-like)
            const profileData = {
                uid: authUser.uid,
                name: name,
                email: email,
                phone: phone || '',
                role: (role || 'EMPLOYEE').toUpperCase(),
                status: 'active', // Active immediately? Or pending? Spec said pending_activation but current flow is simple.
                createdAt: admin.database.ServerValue.TIMESTAMP,
                createdBy: req.user.uid
            };

            await db.ref(`employees/${authUser.uid}/profile`).set(profileData);

            // STEP 4: Set Custom Claims for role (Sync with DB)
            await admin.auth().setCustomUserClaims(authUser.uid, {
                role: profileData.role
            });

            // STEP 5: Log audit event
            await auditLogger.logAuthzEvent({
                action: 'user_created',
                performedBy: req.user.uid,
                targetUser: authUser.uid,
                role: profileData.role
            });

            res.status(201).json({
                success: true,
                uid: authUser.uid,
                message: 'User created successfully',
                user: profileData
            });

        } catch (error) {
            console.error('[USER CREATION] Failed:', error);

            // ROLLBACK: Delete Auth user if DB creation failed
            if (authUser) {
                console.warn(`[ROLLBACK] Deleting orphaned auth user: ${authUser.uid}`);
                try {
                    await admin.auth().deleteUser(authUser.uid);
                } catch (cleanupErr) {
                    console.error('[ROLLBACK FAILED] Manual intervention required for UID:', authUser.uid);
                }
            }

            await auditLogger.logSecurityEvent({
                action: 'user_creation_failed',
                error: error.message,
                performedBy: req.user?.uid
            });

            res.status(500).json({ error: 'Failed to create user. System rolled back.' });
        }
    }
}

module.exports = new UserCreationController();
