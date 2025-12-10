import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getRouteForRole } from '../config/roleConfig'
import { HeroGeometric } from '../components/ui/shape-landing-hero'
import { usePWAInstall } from '../hooks/usePWAInstall'
import './Login.css'
import RefinedModal from '../components/ui/RefinedModal'
import { useState } from 'react'

function Login() {
    const { loginWithGoogle, currentUser, userProfile, loading } = useAuth()
    const navigate = useNavigate()
    const { isInstallable, isInstalled, isIOS, canPrompt, installApp } = usePWAInstall()
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' })

    const showMessage = (title, message, type = 'info') => {
        setModalConfig({ isOpen: true, title, message, type })
    }

    useEffect(() => {
        if (currentUser && userProfile) {
            const route = getRouteForRole(userProfile.role)
            navigate(route)
        }
    }, [currentUser, userProfile, navigate])

    const handleGoogleSignIn = async () => {
        try {
            await loginWithGoogle()
            // Navigation handled by useEffect
        } catch (error) {
            console.error("Login failed:", error)
        }
    }

    const handleInstall = async () => {
        if (canPrompt) {
            // Android/Desktop - can use native prompt
            const installed = await installApp()
            if (installed) {
                console.log('App installed successfully!')
                showMessage('Success', 'ATLAS has been installed successfully!', 'success')
            }
        } else if (isIOS) {
            // iOS - show instructions modal
            showMessage('Install on iOS', 'To install ATLAS:\n\n1. Tap the Share button (📤) at the bottom of Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm', 'info')
        } else {
            // Fallback for other browsers
            showMessage('Install App', 'To install ATLAS:\n\nLook for the install icon in your browser\'s address bar or menu, then click "Install" or "Add to Home Screen"', 'info')
        }
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    return (
        <HeroGeometric
            badge="ATLAS System"
            title1="ATLAS"
        >
            <div className="login-buttons-container">
                <button
                    className="google-login-btn-modern"
                    onClick={handleGoogleSignIn}
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="google-icon"
                    />
                    <span>Continue with Google</span>
                </button>

                {/* PWA Install Button - Only show when not running as PWA and installable */}
                {isInstallable && !isInstalled && !window.matchMedia('(display-mode: standalone)').matches && (
                    <button
                        className="install-app-btn"
                        onClick={handleInstall}
                    >
                        <svg
                            className="install-icon"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>{isIOS ? 'Install App (iOS)' : 'Install ATLAS App'}</span>
                    </button>
                )}

                {/* Direct APK Download Button (Android Only) */}
                {!isIOS && (
                    <a
                        href="/atlas-app.apk"
                        download="ATLAS-App.apk"
                        className="download-apk-btn"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5" />
                        </svg>
                        <span>Download Android APK</span>
                    </a>
                )}
            </div>

            <RefinedModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />
        </HeroGeometric>
    )
}

export default Login
