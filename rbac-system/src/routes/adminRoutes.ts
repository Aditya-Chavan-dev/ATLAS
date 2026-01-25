import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { logAudit } from '../utils/auditLogger';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Apply Auth Middleware to ALL admin routes
router.use(authMiddleware);

// Helper to enforce Owner role
const requireOwner = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'Owner') {
        logAudit(req.user?.email || 'unknown', 'admin_access_denied', 'denied', { path: req.path }, req);
        return res.status(403).json({ error: 'Access denied: Owners only' });
    }
    next();
};

// Helper to enforce Root Owner role
const requireRootOwner = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.isRootOwner) {
        logAudit(req.user?.email || 'unknown', 'admin_access_denied', 'denied', { path: req.path }, req);
        return res.status(403).json({ error: 'Access denied: Root Owner only' });
    }
    next();
};

// 1. GET /pending-users
router.get('/pending-users', requireOwner, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT email, firebase_uid, created_at, pending_expires_at,
      EXTRACT(DAY FROM (pending_expires_at - NOW()))::int as days_remaining
      FROM users WHERE status = 'pending'
    `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// 2. POST /users/:email/approve
router.post('/users/:email/approve', requireOwner, async (req, res) => {
    const { role } = req.body;
    const { email } = req.params;

    if (!['MD', 'HR', 'Employee'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role for approval' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const updateRes = await client.query(
            `UPDATE users 
       SET role = $1, status = 'active', is_active = true, pending_expires_at = NULL
       WHERE email = $2 AND status = 'pending'
       RETURNING id`,
            [role, email]
        );

        if (updateRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found or not pending' });
        }

        await logAudit(req.user!.email, 'user_approved', 'granted', { target: email, role }, req);
        await client.query('COMMIT');
        res.json({ message: 'User approved' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Approval failed' });
    } finally {
        client.release();
    }
});

// 3. DELETE /users/:email/reject
router.delete('/users/:email/reject', requireOwner, async (req, res) => {
    const { email } = req.params;
    const client = await pool.connect();
    try {
        const resDb = await client.query(
            "DELETE FROM users WHERE email = $1 AND status = 'pending' RETURNING id",
            [email]
        );

        if (resDb.rowCount === 0) {
            return res.status(404).json({ error: 'User not found or not pending' });
        }

        await logAudit(req.user!.email, 'user_rejected', 'granted', { target: email }, req);
        res.json({ message: 'User rejected and removed' });
    } catch (err) {
        res.status(500).json({ error: 'Rejection failed' });
    } finally {
        client.release();
    }
});

// 4. GET /users
router.get('/users', requireOwner, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT email, role, status, is_active, is_root_owner, created_at, updated_at
      FROM users
      ORDER BY 
        CASE role 
          WHEN 'Owner' THEN 1 
          WHEN 'MD' THEN 2 
          WHEN 'HR' THEN 3 
          WHEN 'Employee' THEN 4 
          ELSE 5 
        END,
        email ASC
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// 5. PATCH /users/:email/role
router.patch('/users/:email/role', requireOwner, async (req, res) => {
    const { role } = req.body;
    const { email } = req.params;

    if (!['Owner', 'MD', 'HR', 'Employee'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    const client = await pool.connect();
    try {
        // Validations
        const targetQuery = await client.query('SELECT role, is_root_owner FROM users WHERE email = $1', [email]);
        if (targetQuery.rowCount === 0) return res.status(404).json({ error: 'User not found' });

        const target = targetQuery.rows[0];

        // Cannot modify Root Owner
        if (target.is_root_owner) {
            await logAudit(req.user!.email, 'admin_action_blocked', 'denied', { reason: 'cannot_modify_root', target: email }, req);
            return res.status(403).json({ error: 'Cannot modify Root Owner' });
        }

        // Only one Secondary Owner allowed check
        if (role === 'Owner') {
            const ownerCheck = await client.query("SELECT id FROM users WHERE role = 'Owner' AND is_root_owner = false");
            if (ownerCheck.rowCount && ownerCheck.rowCount > 0 && ownerCheck.rows[0].email !== email) {
                // Check if we are promoting a different user while one exists
                return res.status(400).json({ error: 'Secondary Owner already exists. Revoke first.' });
            }
        }

        await client.query('UPDATE users SET role = $1 WHERE email = $2', [role, email]);
        await logAudit(req.user!.email, 'user_role_changed', 'granted', { target: email, new_role: role }, req);

        res.json({ message: 'Role updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    } finally {
        client.release();
    }
});

// 6. PATCH /users/:email/deactivate
router.patch('/users/:email/deactivate', requireOwner, async (req, res) => {
    const { email } = req.params;
    const client = await pool.connect();

    try {
        const targetQuery = await client.query('SELECT is_root_owner FROM users WHERE email = $1', [email]);
        if (targetQuery.rowCount === 0) return res.status(404).json({ error: 'User not found' });

        if (targetQuery.rows[0].is_root_owner) {
            return res.status(403).json({ error: 'Cannot deactivate Root Owner' });
        }

        await client.query("UPDATE users SET is_active = false, status = 'suspended' WHERE email = $1", [email]);
        await logAudit(req.user!.email, 'user_deactivated', 'granted', { target: email }, req);
        res.json({ message: 'User deactivated' });
    } catch (err) {
        res.status(500).json({ error: 'Deactivation failed' });
    } finally {
        client.release();
    }
});

// 7. PATCH /users/:email/activate
router.patch('/users/:email/activate', requireOwner, async (req, res) => {
    const { email } = req.params;
    const client = await pool.connect();

    try {
        // Must have role to be active (Schema constraint usually handles this, but let's be graceful)
        const targetQuery = await client.query('SELECT role FROM users WHERE email = $1', [email]);
        if (targetQuery.rowCount === 0) return res.status(404).json({ error: 'User not found' });

        if (!targetQuery.rows[0].role) {
            return res.status(400).json({ error: 'User has no role. Assign role first.' });
        }

        await client.query("UPDATE users SET is_active = true, status = 'active' WHERE email = $1", [email]);
        await logAudit(req.user!.email, 'user_activated', 'granted', { target: email }, req);
        res.json({ message: 'User activated' });
    } catch (err) {
        res.status(500).json({ error: 'Activation failed' });
    } finally {
        client.release();
    }
});

// 8. POST /secondary-owner/revoke
router.post('/secondary-owner/revoke', requireRootOwner, async (req, res) => {
    const { downgradeToRole } = req.body;

    if (!['MD', 'HR', 'Employee'].includes(downgradeToRole)) {
        return res.status(400).json({ error: 'Invalid downgrade role' });
    }

    const client = await pool.connect();
    try {
        const resDb = await client.query(
            "UPDATE users SET role = $1 WHERE role = 'Owner' AND is_root_owner = false RETURNING email",
            [downgradeToRole]
        );

        if (resDb.rowCount === 0) {
            return res.status(404).json({ error: 'No Secondary Owner found to revoke' });
        }

        await logAudit(req.user!.email, 'secondary_owner_revoked', 'granted', {
            target: resDb.rows[0].email,
            new_role: downgradeToRole
        }, req);

        res.json({ message: 'Secondary owner revoked' });
    } catch (err) {
        res.status(500).json({ error: 'Revocation failed' });
    } finally {
        client.release();
    }
});

// 9. GET /audit-logs
router.get('/audit-logs', requireRootOwner, async (req, res) => {
    const { email, eventType, result, limit = 100 } = req.query;

    try {
        let query = 'SELECT * FROM audit_logs';
        const params: any[] = [];
        const conditions: string[] = [];

        if (email) {
            conditions.push(`user_email = $${params.length + 1}`);
            params.push(email);
        }
        if (eventType) {
            conditions.push(`event_type = $${params.length + 1}`);
            params.push(eventType);
        }
        if (result) {
            conditions.push(`result = $${params.length + 1}`);
            params.push(result);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
        params.push(Number(limit));

        const resDb = await pool.query(query, params);
        res.json(resDb.rows);
    } catch (err) {
        res.status(500).json({ error: 'Log fetch failed' });
    }
});

export default router;
