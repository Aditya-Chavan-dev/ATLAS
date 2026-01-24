/**
 * PURPOSE: Granular role-based access control
 * SECURITY: Works on top of unified auth middleware
 * USAGE: requireRole(['MD']) on admin-only endpoints
 */
const auditLogger = require('../audit/auditLogger');

const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            console.warn(`[AUTHZ] Access Denied: User ${req.user.uid} (${req.user.role}) tried to access ${req.originalUrl}`);

            auditLogger.logAuthzEvent({
                action: 'access_denied',
                uid: req.user.uid,
                requiredRoles: allowedRoles,
                userRole: req.user.role,
                resource: req.originalUrl
            });

            return res.status(403).json({
                error: 'Insufficient permissions',
                code: 'AUTH_INSUFFICIENT_ROLE'
            });
        }

        next();
    };
};

module.exports = requireRole;
