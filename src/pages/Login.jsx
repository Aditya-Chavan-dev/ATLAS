// Login Page - Corporate Blue Design
// Phone Number + Google Sign-In

import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getRouteForRole } from '../config/roleConfig'
import { usePWAInstall } from '../hooks/usePWAInstall'
import './Login.css'
import RefinedModal from '../components/ui/RefinedModal'

// Firebase Phone Auth imports
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth, database } from '../firebase/config'
import { ref, get, child } from 'firebase/database'

function Login() {
    const { loginWithGoogle, currentUser, userProfile, loading } = useAuth()
    const navigate = useNavigate()
    const { isInstallable, isInstalled, isIOS, canPrompt, installApp } = usePWAInstall()
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' })

    // Phone Auth States
    const [phoneNumber, setPhoneNumber] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [showOtpInput, setShowOtpInput] = useState(false)
    const [confirmationResult, setConfirmationResult] = useState(null)
    const [isPhoneLoading, setIsPhoneLoading] = useState(false)
    const [error, setError] = useState('')
    const [resendTimer, setResendTimer] = useState(0)

    const otpInputRefs = useRef([])
    const recaptchaRef = useRef(null)

    const showMessage = (title, message, type = 'info') => {
        setModalConfig({ isOpen: true, title, message, type })
    }

    useEffect(() => {
        if (currentUser && userProfile) {
            const route = getRouteForRole(userProfile.role)
            navigate(route)
        }
    }, [currentUser, userProfile, navigate])

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendTimer])

    // Setup reCAPTCHA
    const setupRecaptcha = () => {
        if (!recaptchaRef.current) {
            recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {
                    console.log('reCAPTCHA verified')
                }
            })
        }
    }

    // Send OTP
    const handleSendOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Please enter a valid 10-digit phone number')
            return
        }

        setIsPhoneLoading(true)
        setError('')

        try {
            setupRecaptcha()
            const formattedNumber = `+91${phoneNumber.replace(/\D/g, '').slice(-10)}`

            const result = await signInWithPhoneNumber(auth, formattedNumber, recaptchaRef.current)
            setConfirmationResult(result)
            setShowOtpInput(true)
            setResendTimer(60)
            showMessage('OTP Sent', `Verification code sent to ${formattedNumber}`, 'success')
        } catch (err) {
            console.error('Error sending OTP:', err)
            setError(err.message || 'Failed to send OTP. Please try again.')

            // Reset reCAPTCHA on error
            if (recaptchaRef.current) {
                recaptchaRef.current.clear()
                recaptchaRef.current = null
            }
        } finally {
            setIsPhoneLoading(false)
        }
    }

    // Handle OTP input
    const handleOtpChange = (index, value) => {
        if (value.length > 1) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus()
        }
    }

    // Handle OTP paste
    const handleOtpPaste = (e) => {
        const pastedData = e.clipboardData.getData('text').slice(0, 6)
        if (/^\d+$/.test(pastedData)) {
            const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''))
            setOtp(newOtp)
            otpInputRefs.current[Math.min(pastedData.length, 5)]?.focus()
        }
    }

    // Handle OTP backspace
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus()
        }
    }

    // Verify OTP
    const handleVerifyOtp = async () => {
        const otpCode = otp.join('')
        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit OTP')
            return
        }

        setIsPhoneLoading(true)
        setError('')

        try {
            const result = await confirmationResult.confirm(otpCode)
            const user = result.user

            // Check if user exists in database
            const dbRef = ref(database)
            const userSnapshot = await get(child(dbRef, `employees/${user.uid}`))

            if (!userSnapshot.exists()) {
                // User not registered - sign out and show error
                await auth.signOut()
                setError('You are not authorized to access this system. Please contact your administrator.')
                setShowOtpInput(false)
                setOtp(['', '', '', '', '', ''])
                return
            }

            // User exists - navigation handled by useEffect
            showMessage('Success', 'Login successful!', 'success')
        } catch (err) {
            console.error('Error verifying OTP:', err)
            setError('Invalid OTP. Please try again.')
            setOtp(['', '', '', '', '', ''])
        } finally {
            setIsPhoneLoading(false)
        }
    }

    // Google Sign In
    const handleGoogleSignIn = async () => {
        try {
            await loginWithGoogle()
        } catch (error) {
            console.error("Login failed:", error)
            setError(error.message || 'Login failed. Please try again.')
        }
    }

    // Install PWA
    const handleInstall = async () => {
        if (canPrompt) {
            const installed = await installApp()
            if (installed) {
                showMessage('Success', 'ATLAS is being installed and will be added to your home screen.', 'success')
            }
        } else if (isIOS) {
            showMessage('Install ATLAS', 'To install ATLAS on your iPhone:\n\n1. Tap the Share button (📤)\n2. Tap "Add to Home Screen"\n3. Tap "Add"', 'info')
        } else {
            showMessage('Install ATLAS', 'To install ATLAS:\n\nTap the three dots (⋮) in your browser menu and select "Install app" or "Add to Home screen".', 'info')
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
        <div className="login-page">
            {/* reCAPTCHA Container (invisible) */}
            <div id="recaptcha-container"></div>

            {/* Logo Section */}
            <div className="login-logo-section">
                <div className="login-logo">
                    <span>A</span>
                </div>
                <p className="login-tagline">Employee Attendance System</p>
            </div>

            {/* Login Card */}
            <div className="login-card">
                <h1 className="login-card-title">Employee Login</h1>
                <p className="login-card-subtitle">Sign in to mark your attendance</p>

                {/* Error Message */}
                {error && <div className="login-error">{error}</div>}

                {!showOtpInput ? (
                    <>
                        {/* Phone Input */}
                        <div className="phone-input-section">
                            <div className="phone-input-wrapper">
                                <div className="country-code">
                                    <span className="country-flag">🇮🇳</span>
                                    <span>+91</span>
                                </div>
                                <input
                                    type="tel"
                                    className="phone-input"
                                    placeholder="Enter phone number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        {/* Send OTP Button */}
                        <button
                            className="login-btn-primary"
                            onClick={handleSendOtp}
                            disabled={isPhoneLoading || phoneNumber.length < 10}
                        >
                            {isPhoneLoading ? 'Sending OTP...' : 'Request OTP'}
                        </button>
                    </>
                ) : (
                    <>
                        {/* OTP Input */}
                        <div className="otp-section">
                            <label className="otp-label">Enter 6-digit OTP</label>
                            <div className="otp-input-group" onPaste={handleOtpPaste}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => otpInputRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        className="otp-input"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        maxLength={1}
                                    />
                                ))}
                            </div>
                            <div className="resend-otp">
                                <button
                                    className="resend-otp-btn"
                                    onClick={handleSendOtp}
                                    disabled={resendTimer > 0 || isPhoneLoading}
                                >
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                </button>
                            </div>
                        </div>

                        {/* Verify Button */}
                        <button
                            className="login-btn-primary"
                            onClick={handleVerifyOtp}
                            disabled={isPhoneLoading || otp.join('').length !== 6}
                        >
                            {isPhoneLoading ? 'Verifying...' : 'Verify & Login'}
                        </button>

                        {/* Back Button */}
                        <button
                            className="login-btn-secondary"
                            onClick={() => {
                                setShowOtpInput(false)
                                setOtp(['', '', '', '', '', ''])
                                setError('')
                            }}
                            style={{ marginTop: '0.75rem' }}
                        >
                            ← Change Phone Number
                        </button>
                    </>
                )}

                {/* Divider */}
                <div className="login-divider">
                    <div className="login-divider-line"></div>
                    <span className="login-divider-text">OR</span>
                    <div className="login-divider-line"></div>
                </div>

                {/* Google Sign In */}
                <button className="login-btn-google" onClick={handleGoogleSignIn}>
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                    />
                    <span>Sign in with Google</span>
                </button>

                {/* Installation Section */}
                {!isInstalled && (
                    <div className="login-actions">
                        <button
                            className="login-btn-secondary install-highlight"
                            onClick={handleInstall}
                        >
                            <span className="install-icon">📲</span>
                            <span>Install ATLAS App</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="login-footer">
                <p className="login-help-text">
                    Need help? <a href="mailto:support@example.com" className="login-help-link">Contact IT Support</a>
                </p>
            </div>

            {/* Modal */}
            <RefinedModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />
        </div>
    )
}

export default Login
