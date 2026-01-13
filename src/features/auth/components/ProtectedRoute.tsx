import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading: authLoading } = useAuth();
    const [claimsRole, setClaimsRole] = useState<string | null>(null);
    const [checkingClaims, setCheckingClaims] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function checkClaims() {
            if (!user) {
                if (mounted) setCheckingClaims(false);
                return;
            }

            try {
                // FORCE REFRESH: Trust nothing cached.
                const tokenResult = await user.getIdTokenResult(true);
                const role = (tokenResult.claims.role as string) || 'employee';
                if (mounted) {
                    setClaimsRole(role);
                    setCheckingClaims(false);
                }
            } catch (e) {
                console.error("Token verification failed", e);
                if (mounted) setCheckingClaims(false); // Fail closed
            }
        }

        if (!authLoading) {
            checkClaims();
        }

        return () => { mounted = false; };
    }, [user, authLoading]);

    if (authLoading || checkingClaims) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-mono text-sm">Verifying Security Token...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // STRICT: Claims-based logic
    if (allowedRoles) {
        // Fallback: If no claim, assume 'employee'
        const role = claimsRole || 'employee';

        if (!allowedRoles.includes(role)) {
            // Redirect unauthorized users
            // If they are Admin trying to access, say, a super-owner route?
            if (role === 'employee') {
                return <Navigate to="/employee/dashboard" replace />;
            } else {
                return <Navigate to="/owner" replace />;
            }
        }
    }

    return <>{children}</>;
}
