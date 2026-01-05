import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, MaintenancePage, useAuth } from '@/features/auth';
import OwnerLayout from '@/features/owner/layouts/OwnerLayout';
import OwnerDashboard from '@/features/owner/pages/OwnerDashboard';
import './App.css';

// Route guard that checks email
function EmailBasedRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check if email is the owner email
    if (user.email === import.meta.env.VITE_OWNER_EMAIL) {
        return <Navigate to="/owner" replace />;
    }

    // All other emails go to maintenance page
    return <MaintenancePage />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Entry Point */}
                <Route path="/" element={<EmailBasedRoute />} />

                {/* Owner Routes */}
                <Route path="/owner" element={<OwnerLayout />}>
                    <Route index element={<OwnerDashboard />} />
                    <Route path="settings" element={<div>Settings Component Placeholder</div>} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
