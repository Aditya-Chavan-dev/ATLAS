import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../../../features/auth/auth.context';
import { AuthGuard } from '../../../features/auth/auth.guard';
import { RoleGuard } from '../../../features/auth/role.guard';
import { RoleRedirect } from '../../../features/auth/role.redirect';
import LoginPage from '../../../features/auth/login.page';
import OwnerDashboard from '../../../features/dashboard/owner.dashboard';
import MdDashboard from '../../../features/dashboard/md.dashboard';
import EmployeeDashboard from '../../../features/dashboard/employee.dashboard';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected — auth required for all below */}
                    <Route element={<AuthGuard />}>

                        {/* Role router — sends user to correct dashboard */}
                        <Route path="/" element={<RoleRedirect />} />

                        {/* Owner routes */}
                        <Route element={<RoleGuard allowedRoles={['owner']} />}>
                            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                        </Route>

                        {/* MD routes */}
                        <Route element={<RoleGuard allowedRoles={['md']} />}>
                            <Route path="/md/dashboard" element={<MdDashboard />} />
                        </Route>

                        {/* Employee routes */}
                        <Route element={<RoleGuard allowedRoles={['employee']} />}>
                            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
                        </Route>

                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
