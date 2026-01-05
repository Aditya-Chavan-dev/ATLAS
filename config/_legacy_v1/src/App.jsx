import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from './firebase/config'
import './styles/MDTheme.css' // Import MD Theme
import './styles/MDComponents.css' // Import MD Component Styles
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ROLES } from './config/roleConfig'
import { useAuth } from './context/AuthContext'
import { requestNotificationPermission, setupForegroundListener } from './services/fcm'
import Login from './pages/Login'
import PWAUpdater from './components/PWAUpdater'
import ErrorBoundary from './components/ErrorBoundary'
import { DashboardSkeleton } from './components/ui/Skeleton'
import logger from './utils/logger'
import ApiService from './services/api' // Import ApiService

// ----------------------------------------------------------------------
// KEEP-ALIVE SYSTEM
// ----------------------------------------------------------------------
const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 Minutes

const startKeepAlive = () => {
    logger.info('[KeepAlive] System started');
    const pingParams = {
        endpoint: '/api/health', // Assume health endpoint exists or root
        method: 'GET'
    };

    const ping = async () => {
        try {
            await ApiService.get(pingParams.endpoint);
            logger.info('[KeepAlive] Ping success');
        } catch (err) {
            // It's okay if it fails, we just want to wake up the server
            logger.debug('[KeepAlive] Ping failed (expected if sleeping):', err.message);
        }
    };

    // Initial ping
    ping();

    return setInterval(ping, KEEP_ALIVE_INTERVAL);
};


// ----------------------------------------------------------------------
// LAZY LOADED MODULES (Code Splitting)
// ----------------------------------------------------------------------
// Each of these will generate a separate JS chunk, downloaded only when needed.

// 1. Employee Bundle
const EmployeeLayout = lazy(() => import('./layouts/EmployeeLayout'))
const EmployeeHome = lazy(() => import('./employee/pages/Home'))
const EmployeeHistory = lazy(() => import('./employee/pages/History'))
const EmployeeLeave = lazy(() => import('./employee/pages/Leave'))
const EmployeeProfile = lazy(() => import('./employee/pages/Profile'))

// 2. MD/Admin Bundle
const MDLayout = lazy(() => import('./layouts/MDLayout'))
const MDDashboard = lazy(() => import('./md/pages/Dashboard'))
const MDHistory = lazy(() => import('./md/pages/History'))
const MDApprovals = lazy(() => import('./md/pages/Approvals'))
const MDProfiles = lazy(() => import('./md/pages/Profiles'))
const MDExport = lazy(() => import('./md/pages/Export'))
const MDEmployeeManagement = lazy(() => import('./md/pages/EmployeeManagement'))

// 3. Specialized Bundles
const MetricsDashboard = lazy(() => import('./pages/MetricsDashboard'))
const HRLayout = lazy(() => import('./layouts/HRLayout'))
const InstallPage = lazy(() => import('./pages/InstallPage'))
const AccessRevoked = lazy(() => import('./pages/AccessRevoked'))

// ----------------------------------------------------------------------

// Loading Fallback (Skeleton Loader for better UX)
const LoadingScreen = () => (
    <div className="min-h-screen bg-slate-50 p-6">
        <DashboardSkeleton />
    </div>
)

// Smart redirect component for MD landing page
function MDLandingRedirect() {
    const [redirectPath, setRedirectPath] = useState(null)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        // SSOT Hardening: We no longer query usage metrics on load.
        // Direct access to Dashboard is the predictable behavior.
        setRedirectPath('/md/dashboard')
        setChecking(false)
    }, [])

    if (checking) return <LoadingScreen />
    return <Navigate to={redirectPath} replace />
}

function AppContent() {
    const { currentUser, userRole, loading, isSuspended } = useAuth()
    const isMD = userRole === ROLES.MD
    const isOwnerRole = userRole === ROLES.OWNER

    // Notification Integration (Master Spec Section 9)
    useEffect(() => {
        // Start Keep-Alive
        const keepAliveTimer = startKeepAlive();

        if (!currentUser) return () => clearInterval(keepAliveTimer);

        // Auto-Register Token or Sync Denial Status
        requestNotificationPermission(currentUser.uid);

        // Foreground Listener
        const unsubscribe = setupForegroundListener();

        // 🔊 DEBUG: Global Alert for receipt proof
        const handleFcmMessage = (event) => {
            const payload = event.detail;
            const title = payload.notification?.title || "Attendance Reminder";
            logger.info('[App] Visual Alert Triggered:', title);
            alert(`🔔 ${title}\n\n${payload.notification?.body || "Check your attendance."}`);
        };
        window.addEventListener('FCM_MESSAGE_RECEIVED', handleFcmMessage);

        return () => {
            clearInterval(keepAliveTimer);
            unsubscribe && unsubscribe();
            window.removeEventListener('FCM_MESSAGE_RECEIVED', handleFcmMessage);
        };
    }, [currentUser]);

    // Show loading while checking auth
    if (loading) return <LoadingScreen />

    // 🔒 SUSPENDED USER TRAP
    if (currentUser && isSuspended) {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <Routes>
                    <Route path="/access-revoked" element={<AccessRevoked />} />
                    <Route path="*" element={<Navigate to="/access-revoked" replace />} />
                </Routes>
            </Suspense>
        )
    }

    return (
        <Suspense fallback={<LoadingScreen />}>
            {/* Not logged in - show Login (and Download page) */}
            {!currentUser && (
                <Routes>
                    <Route path="/" element={<Login />} />
                    {/* Install Page is public but lazy loaded */}
                    <Route path="/install" element={<InstallPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            )}

            {/* Owner & MD Layout */}
            {currentUser && (isMD || isOwnerRole) && (
                <Routes>
                    {/* Owner-Specific Route */}
                    {isOwnerRole && (
                        <Route path="/metrics" element={<MetricsDashboard />} />
                    )}

                    {/* MD Layout (Accessible to MD & Owner) */}
                    <Route path="/md" element={<MDLayout />}>
                        <Route index element={<MDLandingRedirect />} />
                        <Route path="dashboard" element={<MDDashboard />} />
                        <Route path="history" element={<MDHistory />} />
                        <Route path="approvals" element={<MDApprovals />} />
                        <Route path="employees" element={<MDEmployeeManagement />} />
                        <Route path="profiles" element={<MDProfiles />} />
                        <Route path="export" element={<MDExport />} />
                        <Route path="*" element={<Navigate to="/md/dashboard" replace />} />
                    </Route>

                    {/* Redirects */}
                    <Route path="/" element={<Navigate to={isOwnerRole ? "/metrics" : "/md"} replace />} />
                    <Route path="*" element={<Navigate to={isOwnerRole ? "/metrics" : "/md"} replace />} />
                </Routes>
            )}

            {/* HR Layout (Export + Attendance for HR staff) */}
            {currentUser && userRole === ROLES.HR && (
                <Routes>
                    <Route path="/hr" element={<HRLayout />}>
                        <Route index element={<Navigate to="/hr/home" replace />} />
                        <Route path="home" element={<EmployeeHome />} />
                        <Route path="export" element={<MDExport />} />
                        <Route path="*" element={<Navigate to="/hr/home" replace />} />
                    </Route>
                    <Route path="/" element={<Navigate to="/hr" replace />} />
                    <Route path="*" element={<Navigate to="/hr" replace />} />
                </Routes>
            )}

            {/* Employee Layout (Default Fallback for regular auth users) */}
            {currentUser && !isMD && !isOwnerRole && !isOwnerRole && userRole !== ROLES.HR && (
                <Routes>
                    <Route path="/" element={<EmployeeLayout />}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<EmployeeHome />} />
                        <Route path="history" element={<EmployeeHistory />} />
                        <Route path="leave" element={<EmployeeLeave />} />
                        <Route path="profile" element={<EmployeeProfile />} />
                    </Route>
                    {/* Prevent access to /access-revoked if active */}
                    <Route path="/access-revoked" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            )}
        </Suspense>
    )
}

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ThemeProvider>
                    <Routes>
                        <Route path="/*" element={
                            <>
                                <PWAUpdater />
                                <AppContent />
                            </>
                        } />
                    </Routes>
                </ThemeProvider>
            </AuthProvider>
        </ErrorBoundary>
    )
}

export default App


