/**
 * DemoLoginPage.jsx
 * 
 * SIMPLE EXPLANATION:
 * A simulated login page that auto-enters demo credentials and auto-logs in.
 * Shows a 5-second loader with note explaining production authentication.
 * 
 * TECHNICAL DEPTH:
 * - Auto-types demo credentials for visual effect
 * - Automatically logs in after credentials are typed
 * - Shows 5-second loading screen with security explanation
 * - Purely presentational - actual auth happens via Firebase Anonymous
 */

import { useState, useEffect } from 'react'
import '../styles/DemoTheme.css'

function DemoLoginPage({ onLoginComplete }) {
    const [email, setEmail] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [showLoader, setShowLoader] = useState(false)
    const [loadingProgress, setLoadingProgress] = useState(0)

    // Demo credentials that auto-type
    const demoEmail = 'demo.employee@atlas.app'

    // Auto-type the email and then auto-login
    useEffect(() => {
        setIsTyping(true)
        let currentIndex = 0
        const typeInterval = setInterval(() => {
            if (currentIndex <= demoEmail.length) {
                setEmail(demoEmail.slice(0, currentIndex))
                currentIndex++
            } else {
                clearInterval(typeInterval)
                setIsTyping(false)
                // Auto-login after typing completes
                setTimeout(() => {
                    handleAutoLogin()
                }, 500)
            }
        }, 50)

        return () => clearInterval(typeInterval)
    }, [])

    // Handle auto-login
    const handleAutoLogin = () => {
        setIsLoggingIn(true)

        // Show login animation briefly
        setTimeout(() => {
            setIsLoggingIn(false)
            setShowLoader(true)

            // Progress animation for 5 seconds
            let progress = 0
            const progressInterval = setInterval(() => {
                progress += 2
                setLoadingProgress(Math.min(progress, 100))

                if (progress >= 100) {
                    clearInterval(progressInterval)
                    // Complete login after progress reaches 100
                    setTimeout(() => {
                        onLoginComplete()
                    }, 300)
                }
            }, 100) // 50 steps * 100ms = 5 seconds
        }, 800)
    }

    // Show loader with security note
    if (showLoader) {
        return (
            <div className="demo-login-page">
                <div className="demo-loader-container">
                    <div className="loader-card">
                        {/* Animated Logo */}
                        <div className="loader-logo">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>

                        <h2>Entering ATLAS Demo</h2>

                        {/* Progress Bar */}
                        <div className="loader-progress-container">
                            <div
                                className="loader-progress-bar"
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>

                        {/* Security Note */}
                        <div className="loader-security-note">
                            <div className="security-icon">🔐</div>
                            <div className="security-content">
                                <strong>Demo Mode Active</strong>
                                <p>
                                    These are demo credentials. In the real system,
                                    authentication uses Google Sign-In with emails
                                    pre-authorized by the MD to ensure no unauthorized
                                    access to the platform.
                                </p>
                            </div>
                        </div>

                        {/* Features Preview */}
                        <div className="loader-features">
                            <span>✓ Attendance Tracking</span>
                            <span>✓ Real-time Approvals</span>
                            <span>✓ Push Notifications</span>
                        </div>
                    </div>
                </div>

                <style>{`
                    .demo-loader-container {
                        width: 100%;
                        max-width: 480px;
                        animation: fadeIn 0.5s ease;
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .loader-card {
                        background: white;
                        border-radius: 24px;
                        padding: 2.5rem;
                        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
                        text-align: center;
                    }
                    
                    .loader-logo {
                        width: 72px;
                        height: 72px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 1.5rem;
                        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                        border-radius: 20px;
                        color: white;
                        animation: pulse-loader 1.5s ease-in-out infinite;
                    }
                    
                    @keyframes pulse-loader {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    
                    .loader-logo svg {
                        width: 36px;
                        height: 36px;
                    }
                    
                    .loader-card h2 {
                        font-size: 1.5rem;
                        font-weight: 600;
                        color: #1e293b;
                        margin: 0 0 1.5rem;
                    }
                    
                    .loader-progress-container {
                        width: 100%;
                        height: 8px;
                        background: #e2e8f0;
                        border-radius: 100px;
                        overflow: hidden;
                        margin-bottom: 2rem;
                    }
                    
                    .loader-progress-bar {
                        height: 100%;
                        background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
                        border-radius: 100px;
                        transition: width 0.1s ease;
                    }
                    
                    .loader-security-note {
                        display: flex;
                        gap: 14px;
                        padding: 1.25rem;
                        background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
                        border: 1px solid #fcd34d;
                        border-radius: 16px;
                        text-align: left;
                        margin-bottom: 1.5rem;
                    }
                    
                    .security-icon {
                        font-size: 1.5rem;
                        flex-shrink: 0;
                    }
                    
                    .security-content {
                        font-size: 0.875rem;
                        color: #92400e;
                        line-height: 1.6;
                    }
                    
                    .security-content strong {
                        display: block;
                        font-size: 0.9375rem;
                        color: #78350f;
                        margin-bottom: 6px;
                    }
                    
                    .security-content p {
                        margin: 0;
                    }
                    
                    .loader-features {
                        display: flex;
                        justify-content: center;
                        gap: 1rem;
                        flex-wrap: wrap;
                        font-size: 0.8125rem;
                        color: #64748b;
                    }
                    
                    .loader-features span {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    
                    @media (max-width: 480px) {
                        .loader-card {
                            padding: 1.75rem;
                        }
                        
                        .loader-features {
                            flex-direction: column;
                            gap: 0.5rem;
                        }
                    }
                `}</style>
            </div>
        )
    }

    return (
        <div className="demo-login-page">
            <div className="login-container">
                {/* Logo */}
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h1>ATLAS</h1>
                    <p className="login-subtitle">Attendance Tracking & Logging Automation System</p>
                </div>

                {/* Login Card */}
                <div className="login-card">
                    <h2>Sign In</h2>

                    {/* Google Sign-in Button (Demo visual) */}
                    <button className="google-signin-button" disabled>
                        <svg viewBox="0 0 24 24" className="google-icon">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Sign in with Google</span>
                    </button>

                    <div className="login-divider">
                        <span>Demo Mode</span>
                    </div>

                    {/* Email Input with Auto-type */}
                    <div className="login-input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                value={email}
                                readOnly
                                className={isTyping ? 'typing' : ''}
                                placeholder="Loading demo credentials..."
                            />
                            {isTyping && <span className="typing-cursor">|</span>}
                        </div>
                    </div>

                    {/* Login Button */}
                    <button
                        className="login-button"
                        disabled={true}
                    >
                        {isLoggingIn ? (
                            <>
                                <span className="login-spinner"></span>
                                Signing in...
                            </>
                        ) : isTyping ? (
                            'Auto-filling credentials...'
                        ) : (
                            <>
                                <span className="login-spinner"></span>
                                Signing in...
                            </>
                        )}
                    </button>
                </div>

                {/* Demo Badge */}
                <div className="demo-indicator">
                    <span className="demo-dot"></span>
                    Interactive Demo Mode
                </div>
            </div>

            <style>{`
                .demo-login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                
                .login-container {
                    width: 100%;
                    max-width: 420px;
                }
                
                .login-logo {
                    text-align: center;
                    margin-bottom: 2rem;
                    color: white;
                }
                
                .login-logo-icon {
                    width: 64px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    backdrop-filter: blur(10px);
                }
                
                .login-logo-icon svg {
                    width: 32px;
                    height: 32px;
                }
                
                .login-logo h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    margin: 0;
                    letter-spacing: 2px;
                }
                
                .login-subtitle {
                    font-size: 0.875rem;
                    opacity: 0.9;
                    margin-top: 0.5rem;
                }
                
                .login-card {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                }
                
                .login-card h2 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1e293b;
                    text-align: center;
                    margin: 0 0 1.5rem;
                }
                
                .google-signin-button {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 14px 20px;
                    background: white;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 500;
                    color: #475569;
                    cursor: not-allowed;
                    opacity: 0.6;
                    transition: all 0.2s ease;
                }
                
                .google-icon {
                    width: 20px;
                    height: 20px;
                }
                
                .login-divider {
                    display: flex;
                    align-items: center;
                    margin: 1.5rem 0;
                    color: #94a3b8;
                    font-size: 0.875rem;
                }
                
                .login-divider::before,
                .login-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }
                
                .login-divider span {
                    padding: 0 1rem;
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-weight: 600;
                }
                
                .login-input-group {
                    margin-bottom: 1.5rem;
                }
                
                .login-input-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #475569;
                    margin-bottom: 0.5rem;
                }
                
                .input-wrapper {
                    position: relative;
                }
                
                .input-wrapper input {
                    width: 100%;
                    padding: 14px 16px;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                    color: #1e293b;
                    transition: border-color 0.2s ease;
                    box-sizing: border-box;
                }
                
                .input-wrapper input:focus {
                    outline: none;
                    border-color: #6366f1;
                }
                
                .input-wrapper input.typing {
                    border-color: #6366f1;
                    background: #f8fafc;
                }
                
                .typing-cursor {
                    position: absolute;
                    right: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #6366f1;
                    font-weight: 300;
                    animation: blink 0.8s infinite;
                }
                
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                
                .login-button {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 14px 20px;
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .login-button:disabled {
                    opacity: 0.9;
                    cursor: not-allowed;
                }
                
                .login-spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .demo-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 1.5rem;
                    padding: 10px 20px;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(10px);
                    border-radius: 100px;
                    color: white;
                    font-size: 0.875rem;
                    font-weight: 500;
                }
                
                .demo-dot {
                    width: 8px;
                    height: 8px;
                    background: #4ade80;
                    border-radius: 50%;
                    animation: pulse-dot 2s infinite;
                }
                
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.2); }
                }
            `}</style>
        </div>
    )
}

export default DemoLoginPage
