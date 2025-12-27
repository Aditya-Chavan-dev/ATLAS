// ⚠️ ⚠️ ⚠️ CRITICAL - DO NOT MODIFY ⚠️ ⚠️ ⚠️
// This file contains FROZEN role configuration and routing
// Any changes may break role-based access control
// Last verified working: 2025-12-27
// If you need to make changes, consult the deployment documentation first
// ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️

// Owner email - Used for BOOTSTRAPPING only.
export const OWNER_EMAIL = 'adityagchavan3@gmail.com';

// Frozen Role Semantic Contract
export const ROLES = {
    OWNER: 'owner',
    MD: 'md',
    EMPLOYEE: 'employee',
    HR: 'hr',
};

export const ROLE_ROUTES = {
    [ROLES.OWNER]: '/metrics',
    [ROLES.MD]: '/md/dashboard',
    [ROLES.EMPLOYEE]: '/dashboard',
    [ROLES.HR]: '/hr/export',
};

// Pure function to determine start route
export const getRouteForRole = (role) => {
    return ROLE_ROUTES[role] || '/';
};

// Check if email is the owner - ONLY for bootstrapping logic
export const isOwnerEmail = (email) => {
    return email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
};
