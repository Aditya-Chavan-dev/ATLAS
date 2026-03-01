import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth.hooks';
import type { UserRole } from './auth.types';

interface RoleGuardProps {
    allowedRoles: UserRole[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    if (!allowedRoles.includes(user.role)) {
        // Redirect them to their own dashboard, not login
        const roleRouteMap: Record<string, string> = {
            owner: '/owner/dashboard',
            md: '/md/dashboard',
            employee: '/employee/dashboard',
        };
        return <Navigate to={roleRouteMap[user.role] ?? '/login'} replace />;
    }

    return <Outlet />;
}
