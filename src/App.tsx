import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, MaintenancePage, useAuth, useUserProfile, ProtectedRoute } from '@/features/auth';
import OwnerLayout from '@/features/owner/layouts/OwnerLayout';
import OwnerDashboard from '@/features/owner/pages/OwnerDashboard';
import EmployeeLayout from '@/features/employee/components/EmployeeLayout';
import EmployeeDashboard from '@/features/employee/pages/EmployeeDashboard';
import MDLayout from '@/features/md/layouts/MDLayout';
import MDDashboard from '@/features/md/pages/MDDashboard';
import LeaveDashboard from '@/features/leave/pages/LeaveDashboard';
import LeaveApprovals from '@/features/md/pages/LeaveApprovals';
import EmployeeHistory from '@/features/employee/pages/EmployeeHistory';
import EmployeeProfile from '@/features/employee/pages/EmployeeProfile';
import './App.css';

// 🛡️ Logic to decide where a user goes
function RoleDispatcher() {
    const { user, loading: authLoading } = useAuth();
    const { profile, loading: profileLoading } = useUserProfile();

    if (authLoading || profileLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-slate-500">Initializing System...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 🚨 Emergency Override for Owner
    // This allows the main admin to access Owner Portal even if DB profile is missing/wrong
    if (user && user.email === 'adityagchavan3@gmail.com') {
        return <Navigate to="/owner" replace />;
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <div className="text-center px-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-xl">👤</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Setting up Profile</h3>
                    <p className="text-sm text-gray-500 mt-1">Please wait while we initialize your account...</p>
                </div>
            </div>
        );
    }

    if (profile.status === 'suspended' || profile.status === 'deleted') {
        return <MaintenancePage />;
    }

    // Role Routing
    switch (profile.role) {
        case 'owner':
            return <Navigate to="/owner" replace />;
        case 'employee':
            return <Navigate to="/employee" replace />;
        case 'md':
            return <Navigate to="/md" replace />;
        default:
            return <Navigate to="/employee" replace />; // Default fallback
    }
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                {/* Root Route: Dispatches to correct portal based on role */}
                <Route path="/" element={<RoleDispatcher />} />

                {/* 👑 Owner Portal (Restricted) */}
                <Route
                    path="/owner"
                    element={
                        <ProtectedRoute allowedRoles={['owner', 'md', 'hr']}>
                            <OwnerLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<OwnerDashboard />} />
                </Route>

                {/* 👤 Employee Portal (Restricted) */}
                <Route
                    path="/employee"
                    element={
                        <ProtectedRoute allowedRoles={['employee', 'owner', 'md', 'hr']}>
                            <EmployeeLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<EmployeeDashboard />} />
                    <Route path="history" element={<EmployeeHistory />} />
                    <Route path="leave" element={<LeaveDashboard />} />
                    <Route path="profile" element={<EmployeeProfile />} />
                </Route>

                {/* 👔 MD Portal (Restricted) */}
                <Route
                    path="/md"
                    element={
                        <ProtectedRoute allowedRoles={['md', 'owner']}>
                            <MDLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<MDDashboard />} />
                    <Route path="leaves" element={<LeaveApprovals />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
