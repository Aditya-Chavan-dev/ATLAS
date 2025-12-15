/**
 * DemoApp.jsx
 * 
 * SIMPLE EXPLANATION:
 * This is the main entry point for the demo application. It sets up
 * providers, handles anonymous authentication, and renders the demo UI.
 * This entire component tree is ISOLATED from production data.
 * 
 * TECHNICAL DEPTH:
 * - Completely separate from production App.jsx
 * - Uses anonymous Firebase auth (no real user accounts)
 * - Shows simulated login page first for recruiter experience
 * - Initializes demo session tracking
 * - Logs VISIT event on first load
 * 
 * DEMO FLOW:
 * 1. Loading → Firebase auth initialization
 * 2. Login Page → Shows auto-credentials with production note
 * 3. Demo → Interactive split-screen demo with guided tour
 * 
 * ISOLATION GUARANTEE:
 * All demo data lives under /demo/ in Firebase
 * Production paths (/employees, /attendance, etc.) are unreachable
 */

import { useEffect, useState } from 'react'
import { signInAnonymously } from 'firebase/auth'
import { auth } from '../src/firebase/config'
import { DemoProvider } from './context/DemoContext'
import DemoContainer from './components/DemoContainer'
import DemoLoginPage from './components/DemoLoginPage'
import { useDemoMetrics } from './hooks/useDemoMetrics'
import './styles/DemoTheme.css'

// Loading screen component
function DemoLoadingScreen() {
    return (
        <div className="demo-loading-screen">
            <div className="loading-content">
                <div className="loading-logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>
                <h2>ATLAS Demo</h2>
                <p>Initializing interactive demo...</p>
                <div className="loading-spinner"></div>
            </div>

            <style>{`
                .demo-loading-screen {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                
                .loading-content {
                    text-align: center;
                }
                
                .loading-logo {
                    width: 64px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    border-radius: 16px;
                    color: white;
                    animation: pulse-logo 2s ease-in-out infinite;
                }
                
                .loading-logo svg {
                    width: 32px;
                    height: 32px;
                }
                
                @keyframes pulse-logo {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .loading-content h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                }
                
                .loading-content p {
                    font-size: 0.9375rem;
                    color: #64748b;
                    margin-bottom: 1.5rem;
                }
                
                .loading-spinner {
                    width: 32px;
                    height: 32px;
                    margin: 0 auto;
                    border: 3px solid #e2e8f0;
                    border-top-color: #6366f1;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

// Error screen component
function DemoErrorScreen({ error, onRetry }) {
    return (
        <div className="demo-error-screen">
            <div className="error-content">
                <div className="error-icon">⚠️</div>
                <h2>Unable to Load Demo</h2>
                <p>{error}</p>
                <button onClick={onRetry}>Try Again</button>
            </div>

            <style>{`
                .demo-error-screen {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                
                .error-content {
                    text-align: center;
                    max-width: 400px;
                    padding: 2rem;
                }
                
                .error-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                
                .error-content h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                }
                
                .error-content p {
                    font-size: 0.9375rem;
                    color: #64748b;
                    margin-bottom: 1.5rem;
                }
                
                .error-content button {
                    padding: 0.75rem 2rem;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.9375rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }
                
                .error-content button:hover {
                    background: #4f46e5;
                }
            `}</style>
        </div>
    )
}

// Inner component that has access to metrics
function DemoAppInner() {
    const { logVisit } = useDemoMetrics()

    // Log visit event on mount
    useEffect(() => {
        logVisit()
    }, [logVisit])

    return <DemoContainer />
}

// Main Demo App component
function DemoApp() {
    const [authState, setAuthState] = useState('loading') // 'loading' | 'login' | 'authenticated' | 'error'
    const [error, setError] = useState(null)

    // Handle anonymous authentication
    const initializeAuth = async () => {
        try {
            setAuthState('loading')
            setError(null)

            // Sign in anonymously for demo
            // This creates a temporary Firebase session without requiring credentials
            await signInAnonymously(auth)

            console.log('✅ Demo auth initialized (anonymous)')
            // Show login page instead of going directly to demo
            setAuthState('login')

        } catch (err) {
            console.error('❌ Demo auth failed:', err)
            setError(err.message || 'Failed to initialize demo')
            setAuthState('error')
        }
    }

    // Handle login completion (from DemoLoginPage)
    const handleLoginComplete = () => {
        setAuthState('authenticated')
    }

    // Initialize on mount
    useEffect(() => {
        initializeAuth()
    }, [])

    // Loading state
    if (authState === 'loading') {
        return <DemoLoadingScreen />
    }

    // Error state
    if (authState === 'error') {
        return <DemoErrorScreen error={error} onRetry={initializeAuth} />
    }

    // Login page - show before demo
    if (authState === 'login') {
        return <DemoLoginPage onLoginComplete={handleLoginComplete} />
    }

    // Authenticated - render demo
    return (
        <DemoProvider>
            <DemoAppInner />
        </DemoProvider>
    )
}

export default DemoApp
