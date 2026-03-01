// src/features/auth/auth.guard.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth.hooks';

export function AuthGuard() {
    const { status } = useAuth();

    if (status === 'loading') {
        return (
            <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
                <p>Loading...</p> {/* Replace with your real spinner component */}
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return <Navigate to="/login" replace />;
    }

    if (status === 'access-denied') {
        return <Navigate to="/login?error=access-denied" replace />;
    }

    return <Outlet />;
}
