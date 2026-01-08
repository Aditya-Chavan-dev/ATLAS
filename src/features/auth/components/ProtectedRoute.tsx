// Protected route component - requires authentication
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading: authLoading } = useAuth();
    const { profile, loading: profileLoading } = useUserProfile();
    // const location = useLocation(); // Unused for now

    if (authLoading || (user && profileLoading)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role Based Access Control

    if (allowedRoles && profile) {
        if (!allowedRoles.includes(profile.role)) {
            // Redirect based on their ACTUAL role
            if (profile.role === 'employee') {
                return <Navigate to="/employee/dashboard" replace />;
            } else if (['owner', 'md', 'hr'].includes(profile.role)) {
                // If they have admin rights but tried to access an employee route (rare) or forbidden route
                // Actually if they are MD and try to access owner route, it's fine if allowedRoles includes MD.
                // If they are Employee and try to access Owner route, they hit this block.
                return <Navigate to="/owner" replace />;
            }
        }
    }

    // Special Case: If user is on root or login, this component isn't used there usually.
    // But if they are an Employee trying to access Owner routes (which likely require 'owner'/'md'), they get bounced above.

    return <>{children}</>;
}
