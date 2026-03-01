import { Navigate } from 'react-router-dom';
import { useAuth } from './auth.hooks';

const roleRouteMap: Record<string, string> = {
    owner: '/owner/dashboard',
    md: '/md/dashboard',
    employee: '/employee/dashboard',
};

export function RoleRedirect() {
    const { user } = useAuth();

    if (!user?.role) return <Navigate to="/login" replace />;

    const destination = roleRouteMap[user.role] ?? '/login';
    return <Navigate to={destination} replace />;
}
