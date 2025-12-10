import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, requiredRole }) {
    const { currentUser, userRole, loading } = useAuth()

    // Show loading state while checking auth
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                fontSize: '1.5rem'
            }}>
                Loading...
            </div>
        )
    }

    // Not logged in - redirect to login
    if (!currentUser) {
        return <Navigate to="/" replace />
    }

    // Logged in but wrong role
    if (requiredRole && userRole !== requiredRole) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <h1 style={{ color: '#e74c3c', marginBottom: '1rem' }}>⛔ Access Denied</h1>
                <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
                    You don't have permission to access this page.
                </p>
                <button
                    onClick={() => window.location.href = userRole === 'md' ? '/md' : '/employee'}
                    style={{
                        padding: '1rem 2rem',
                        fontSize: '1rem',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Go to Your Dashboard
                </button>
            </div>
        )
    }

    // Authorized - render children
    return children
}

export default ProtectedRoute
