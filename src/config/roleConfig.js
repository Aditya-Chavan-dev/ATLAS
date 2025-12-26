// ⚠️ ⚠️ ⚠️ CRITICAL - DO NOT MODIFY ⚠️ ⚠️ ⚠️
// This file contains FROZEN role configuration and routing
// Any changes may break role-based access control
// Last verified working: 2025-12-12
// If you need to make changes, consult the deployment documentation first
// ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️

// Role Configuration
// Centralized role constants and route mapping

// Owner email - has access to metrics dashboard
export const OWNER_EMAIL = 'admin@example.com'; // Placeholder

export const ROLES = {
    OWNER: 'owner',
    MD: 'md',
    EMPLOYEE: 'employee',
    HR: 'hr', // Restricted to Export only
};

// Phone Authentication Restriction
// Only this number can use phone login (format: 9999999999)
// Set to '' to disable restriction (allow all) or a specific 10-digit number
export const ALLOWED_PHONE_NUMBER = import.meta.env.VITE_ALLOWED_PHONE_NUMBER || '';

export const ROLE_ROUTES = {
    [ROLES.OWNER]: '/metrics',
    [ROLES.MD]: '/md/dashboard',
    [ROLES.EMPLOYEE]: '/dashboard',
    [ROLES.HR]: '/hr/export',
};

export const getRouteForRole = (role) => {
    return ROLE_ROUTES[role] || '/';
};

// Check if email is the owner
export const isOwner = (email) => {
    return email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
};
