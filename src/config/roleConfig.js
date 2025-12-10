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
