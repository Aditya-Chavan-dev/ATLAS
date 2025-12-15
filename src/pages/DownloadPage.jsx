// Download Page - APK Download for Android
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import {
    DevicePhoneMobileIcon,
    ArrowDownTrayIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function DownloadPage() {
    const { isDarkMode } = useTheme()
    const [showInstructions, setShowInstructions] = useState(false)

    const handleDownload = () => {
        // APK will be hosted at /downloads/atlas.apk
        const link = document.createElement('a')
        link.href = '/downloads/atlas.apk'
        link.download = 'ATLAS.apk'
        link.click()
        setShowInstructions(true)
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: isDarkMode ? '#0c1222' : '#f8fafc' }}
        >
            <div
                className="max-w-md w-full rounded-2xl p-8 text-center"
                style={{
                    background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                    boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)'
                }}
            >
                {/* App Icon */}
                <div
                    className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center text-white text-3xl font-bold"
                    style={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)'
                    }}
                >
                    A
                </div>

                <h1
                    className="text-2xl font-bold mb-2"
                    style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                >
                    ATLAS for Android
                </h1>
                <p
                    className="text-sm mb-8"
                    style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                >
                    Attendance Tracking & Leave Application System
                </p>

                {/* Features */}
                <div className="space-y-3 mb-8 text-left">
                    {[
                        'One-tap attendance marking',
                        'Push notifications for reminders',
                        'Offline support',
                        'Leave management'
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <CheckCircleIcon
                                className="w-5 h-5 flex-shrink-0"
                                style={{ color: '#22c55e' }}
                            />
                            <span
                                className="text-sm"
                                style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
                            >
                                {feature}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                        color: '#ffffff',
                        boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)'
                    }}
                >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Download APK
                </button>

                {/* Version Info */}
                <p
                    className="text-xs mt-4"
                    style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}
                >
                    Version 1.0.0 • 15 MB
                </p>

                {/* Installation Instructions */}
                {showInstructions && (
                    <div
                        className="mt-6 p-4 rounded-xl text-left"
                        style={{
                            background: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} />
                            <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
                                Installation Steps
                            </p>
                        </div>
                        <ol className="text-xs space-y-2" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                            <li>1. Open the downloaded file</li>
                            <li>2. If prompted, enable "Install from Unknown Sources"</li>
                            <li>3. Tap "Install" to complete installation</li>
                            <li>4. Open ATLAS and sign in with Google</li>
                        </ol>
                    </div>
                )}

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    <ShieldCheckIcon className="w-4 h-4" style={{ color: '#22c55e' }} />
                    <span
                        className="text-xs"
                        style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}
                    >
                        Safe & Secure from your organization
                    </span>
                </div>
            </div>
        </div>
    )
}
