import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from './firebase/config'
import './styles/MDTheme.css' // Import MD Theme
import MDLayout from './layouts/MDLayout'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ROLES } from './config/roleConfig'
import ProtectedRoute from './components/ProtectedRoute'
import EmployeeLayout from './layouts/EmployeeLayout'
import EmployeeHome from './employee/pages/Home'
import EmployeeHistory from './employee/pages/History'
import EmployeeLeave from './employee/pages/Leave'
import EmployeeProfile from './employee/pages/Profile'
import Login from './pages/Login'
import MDDashboard from './md/pages/Dashboard'
import MDApprovals from './md/pages/Approvals'
import MDProfiles from './md/pages/Profiles'
import MDProfileDetail from './md/pages/ProfileDetail'
import MDExport from './md/pages/Export'
import MDEmployeeManagement from './md/pages/EmployeeManagement'
import { useAuth } from './context/AuthContext'

// Smart redirect component for MD landing page
function MDLandingRedirect() {
    const [redirectPath, setRedirectPath] = useState(null)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        const attendanceRef = ref(database, 'attendance')
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const hasPending = Object.values(data).some(item =>
                    item.status === 'pending' ||
                    item.status === 'correction_pending' ||
                    item.status === 'edit_pending'
                )
                setRedirectPath(hasPending ? '/md/approvals' : '/md/dashboard')
            } else {
                setRedirectPath('/md/dashboard')
            }
            setChecking(false)
        }, { onlyOnce: true }) // Only check once on load

        return () => unsubscribe()
    }, [])

    if (checking) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return <Navigate to={redirectPath} replace />
}

function AppContent() {
    const { currentUser, userRole, loading } = useAuth()
    const isMD = userRole === ROLES.MD

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    // Not logged in - show Login
    if (!currentUser) {
        return (
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        )
    }

    // MD Layout
    if (isMD) {
        return (
            <Routes>
                <Route path="/md" element={<MDLayout />}>
                    <Route index element={<Navigate to="/md/dashboard" replace />} />
                    <Route path="dashboard" element={<MDDashboard />} />
                    <Route path="approvals" element={<MDApprovals />} />
                    <Route path="employees" element={<MDEmployeeManagement />} />
                    <Route path="profiles" element={<MDProfiles />} />
                    <Route path="profiles/:id" element={<MDProfileDetail />} />
                    <Route path="export" element={<MDExport />} />
                    <Route path="*" element={<Navigate to="/md/dashboard" replace />} />
                </Route>
                <Route path="/" element={<Navigate to="/md" replace />} />
                <Route path="*" element={<Navigate to="/md" replace />} />
            </Routes>
        )
    }

    // Employee Layout
    return (
        <Routes>
            <Route path="/" element={<EmployeeLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<EmployeeHome />} />
                <Route path="history" element={<EmployeeHistory />} />
                <Route path="leave" element={<EmployeeLeave />} />
                <Route path="profile" element={<EmployeeProfile />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}

import PWAUpdater from './components/PWAUpdater'

// ...

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <PWAUpdater />
                <AppContent />
            </ThemeProvider>
        </AuthProvider>
    )
}

export default App

