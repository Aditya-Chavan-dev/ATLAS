import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, MaintenancePage, useAuth, useUserProfile, ProtectedRoute } from '@/features/auth';
import OwnerLayout from '@/features/owner/layouts/OwnerLayout';
import OwnerDashboard from '@/features/owner/pages/OwnerDashboard';
import EmployeeLayout from '@/features/employee/components/EmployeeLayout';
import EmployeeDashboard from '@/features/employee/pages/EmployeeDashboard';
import LeaveDashboard from '@/features/leave/pages/LeaveDashboard';
import MDLayout from '@/features/md/layouts/MDLayout';
import MDDashboard from '@/features/md/pages/MDDashboard';
import MDLeaveApprovals from '@/features/md/pages/MDLeaveApprovals';
import EmployeeHistory from '@/features/employee/pages/EmployeeHistory';
import EmployeeProfile from '@/features/employee/pages/EmployeeProfile';
import './App.css';

// 🛡️ Logic to decide where a user goes
function RoleDispatcher() {
    const { user, loading: authLoading } = useAuth();
    const [role, setRole] = useState<string | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setChecking(false);
            return;
        }

        user.getIdTokenResult().then(token => {
            setRole((token.claims.role as string) || 'employee');
            setChecking(false);
        }).catch(() => setChecking(false));
    }, [user, authLoading]);

    if (authLoading || checking) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-slate-500">Authenticating Secure Session...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Secure Routing based on Verification
    switch (role) {
        case 'owner':
            return <Navigate to="/owner" replace />;
        case 'md':
            return <Navigate to="/md" replace />;
        case 'hr':
            return <Navigate to="/hr" replace />;
        default:
            return <Navigate to="/employee" replace />;
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
                    <Route path="leave" element={<LeaveDashboard />} />
                    <Route path="history" element={<EmployeeHistory />} />
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
                    <Route path="leaves" element={<MDLeaveApprovals />} />
                </Route>

                {/* 🤝 HR Portal (Restricted) */}
                <Route
                    path="/hr"
                    element={
                        <ProtectedRoute allowedRoles={['hr', 'owner']}>
                            <OwnerLayout /> {/* HR shares Owner Layout for now */}
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<OwnerDashboard />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
