import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';
import { pool } from '../config/database';
import { logAudit } from '../utils/auditLogger';

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let userEmail = 'unknown';

    try {
        // Step 1: Extract Token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            await logAudit(userEmail, 'auth_missing_token', 'denied', undefined, req);
            return res.status(401).json({ error: 'Unauthorized: Missing token' });
        }

        const idToken = authHeader.split('Bearer ')[1];

        // Step 2: Verify Firebase Token
        let decodedToken;
        try {
            decodedToken = await firebaseAuth.verifyIdToken(idToken, true);
        } catch (error: any) {
            await logAudit(userEmail, 'auth_invalid_token', 'denied', { error: error.message }, req);
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        if (!decodedToken.email) {
            await logAudit('unknown', 'auth_missing_email', 'denied', undefined, req);
            return res.status(401).json({ error: 'Unauthorized: No email in token' });
        }

        // CRITICAL SECURITY CHECK: Email must be verified to prevent account hijacking
        if (!decodedToken.email_verified) {
            await logAudit(decodedToken.email, 'auth_unverified_email', 'denied', undefined, req);
            return res.status(403).json({ error: 'Unauthorized: Email not verified' });
        }

        userEmail = decodedToken.email;
        const uid = decodedToken.uid;

        // Step 3: Query User Registry (Source of Truth)
        const client = await pool.connect();
        try {
            const userRes = await client.query('SELECT * FROM users WHERE email = $1', [userEmail]);
            const user = userRes.rows[0];

            // Step 4: Decision Tree

            // Case: User NOT in database -> Create Pending
            if (!user) {
                const ttlDays = parseInt(process.env.PENDING_USER_TTL_DAYS!, 10);
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + ttlDays);

                // Use ON CONFLICT to handle race conditions gracefully (Idempotent)
                await client.query(
                    `INSERT INTO users (email, firebase_uid, status, is_active, role, pending_expires_at)
             VALUES ($1, $2, 'pending', false, null, $3)
             ON CONFLICT (email) DO NOTHING`,
                    [userEmail, uid, expiresAt]
                );

                await logAudit(userEmail, 'user_pending_created', 'denied', { reason: 'not_in_allowlist' }, req);
                return res.status(403).json({ error: 'Your account is pending approval' });
            }

            // Case: Inactive or Invalid Status
            if (!user.is_active || user.status !== 'active') {
                await logAudit(userEmail, 'auth_denied', 'denied', { reason: 'inactive', status: user.status }, req);
                return res.status(403).json({ error: 'Account is inactive or suspended' });
            }

            // Case: No Role Assigned
            if (!user.role) {
                await logAudit(userEmail, 'auth_denied', 'denied', { reason: 'no_role' }, req);
                return res.status(403).json({ error: 'Access denied: No role assigned' });
            }

            // Case: First Login (Bind UID)
            if (!user.firebase_uid) {
                await client.query('UPDATE users SET firebase_uid = $1 WHERE id = $2', [uid, user.id]);
                user.firebase_uid = uid; // Update local obj
                await logAudit(userEmail, 'user_uid_bound', 'granted', { uid }, req);
                // Continue flow...
            }
            // Case: Critical Security Mismatch
            else if (user.firebase_uid !== uid) {
                await logAudit(userEmail, 'auth_uid_mismatch', 'denied', {
                    expected: user.firebase_uid,
                    received: uid
                }, req);
                return res.status(403).json({ error: 'Security Violation: UID mismatch' });
            }

            // Step 5: Authorization Granted
            req.user = {
                id: user.id,
                email: user.email,
                firebaseUid: user.firebase_uid,
                role: user.role,
                roleVersion: user.role_version,
                isRootOwner: user.is_root_owner
            };

            // Only log success for sensitive actions or periodically? 
            // Spec says "Every decision logged". So we log Grant.
            await logAudit(userEmail, 'auth_granted', 'granted', undefined, req);

            next();

        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Middleware Error:', error);
        await logAudit(userEmail, 'auth_error', 'denied', { error: error.message }, req);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
