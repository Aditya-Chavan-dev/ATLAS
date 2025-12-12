// ⚠️ ⚠️ ⚠️ CRITICAL - DO NOT MODIFY ⚠️ ⚠️ ⚠️
// This file contains FROZEN role configuration and routing
// Any changes may break role-based access control
// Last verified working: 2025-12-12
// If you need to make changes, consult the deployment documentation first
// ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️

// Role Configuration
// Centralized role constants and route mapping


export const ROLES = {
    MD: 'md',
    EMPLOYEE: 'employee',
};

export const ROLE_ROUTES = {
    [ROLES.MD]: '/md/dashboard',
    [ROLES.EMPLOYEE]: '/dashboard',
};

export const getRouteForRole = (role) => {
    return ROLE_ROUTES[role] || '/';
};
