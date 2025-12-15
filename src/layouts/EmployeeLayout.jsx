import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import { requestNotificationPermission, setupForegroundListener } from '../services/fcm'
import {
    HomeIcon,
    CalendarDaysIcon,
    ClockIcon,
    UserIcon,
    SunIcon,
    MoonIcon
} from '@heroicons/react/24/outline'
// import '../employee/employee-theme.css'

export default function EmployeeLayout() {
    const { currentUser } = useAuth()
    const { isDarkMode, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    const { isOnline } = useConnectionStatus()
    const [foregroundNotification, setForegroundNotification] = useState(null)

    // Initialize FCM and request notification permission
    useEffect(() => {
        if (currentUser?.uid) {
            requestNotificationPermission(currentUser.uid)

            const unsubscribe = setupForegroundListener((payload) => {
                setForegroundNotification({
                    title: payload.notification?.title || 'Notification',
                    body: payload.notification?.body || '',
                    timestamp: Date.now()
                })
                setTimeout(() => setForegroundNotification(null), 5000)
            })

            return () => {
                if (unsubscribe) unsubscribe()
            }
        }
    }, [currentUser])

    const navigation = [
        { name: 'Home', href: '/dashboard', icon: HomeIcon },
        { name: 'History', href: '/history', icon: CalendarDaysIcon },
        { name: 'Leave', href: '/leave', icon: ClockIcon },
        { name: 'Profile', href: '/profile', icon: UserIcon },
    ]

    return (
        <div className="emp-layout min-h-screen font-sans">
            {/* Foreground Notification Toast */}
            {foregroundNotification && (
                <div className="fixed top-4 right-4 z-[100] emp-fade-in">
                    <div className="emp-card p-4 max-w-sm shadow-xl">
                        <div className="flex items-start gap-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'var(--emp-accent-glow)' }}
                            >
                                <svg className="w-5 h-5" style={{ color: 'var(--emp-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: 'var(--emp-text-primary)' }}>
                                    {foregroundNotification.title}
                                </p>
                                <p className="text-sm mt-0.5" style={{ color: 'var(--emp-text-secondary)' }}>
                                    {foregroundNotification.body}
                                </p>
                            </div>
                            <button
                                onClick={() => setForegroundNotification(null)}
                                style={{ color: 'var(--emp-text-muted)' }}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar - Hidden on mobile */}
            <aside
                className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 flex-col z-40"
                style={{
                    background: 'var(--emp-nav-bg)',
                    borderRight: '1px solid var(--emp-border)'
                }}
            >
                {/* Logo */}
                <div
                    className="h-16 px-6 flex items-center gap-3"
                    style={{ borderBottom: '1px solid var(--emp-border)' }}
                >
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        style={{ background: 'var(--emp-button-gradient)' }}
                    >
                        A
                    </div>
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: 'var(--emp-text-primary)' }}>ATLAS</h1>
                        <p className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>Employee Portal</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.href)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                                style={{
                                    background: isActive ? 'var(--emp-accent-glow)' : 'transparent',
                                    color: isActive ? 'var(--emp-accent)' : 'var(--emp-text-secondary)'
                                }}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-2' : ''}`} />
                                <span className="font-medium">{item.name}</span>
                            </button>
                        )
                    })}
                </nav>

                {/* Theme Toggle & User Info */}
                <div className="p-4" style={{ borderTop: '1px solid var(--emp-border)' }}>
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-3 transition-all"
                        style={{ background: 'var(--emp-bg-card)' }}
                    >
                        <span className="text-sm font-medium" style={{ color: 'var(--emp-text-secondary)' }}>
                            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </span>
                        {isDarkMode ? (
                            <MoonIcon className="w-5 h-5" style={{ color: 'var(--emp-accent)' }} />
                        ) : (
                            <SunIcon className="w-5 h-5" style={{ color: 'var(--emp-warning)' }} />
                        )}
                    </button>

                    {/* User Info */}
                    <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: 'var(--emp-bg-card)' }}
                    >
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                            style={{ background: 'var(--emp-accent-glow)', color: 'var(--emp-accent)' }}
                        >
                            {currentUser?.displayName?.charAt(0) || 'E'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--emp-text-primary)' }}>
                                {currentUser?.displayName || 'Employee'}
                            </p>
                            <p className="text-xs truncate" style={{ color: 'var(--emp-text-muted)' }}>
                                {currentUser?.email}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header
                className="lg:hidden emp-header fixed top-0 left-0 right-0 z-50 h-16 px-4 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg"
                        style={{ background: 'var(--emp-button-gradient)' }}
                    >
                        A
                    </div>
                    <div>
                        <h1 className={`text-sm font-semibold leading-tight emp-header-text`} style={{ color: isDarkMode ? 'var(--emp-text-primary)' : undefined }}>
                            {currentUser?.displayName || 'Employee'}
                        </h1>
                        <div className="flex items-center gap-1">
                            <span className={`text-xs emp-header-text`} style={{ color: isDarkMode ? 'var(--emp-text-muted)' : undefined, opacity: 0.8 }}>
                                ATLAS
                            </span>
                            <div
                                className={`w-1.5 h-1.5 rounded-full animate-pulse`}
                                style={{ background: isOnline ? 'var(--emp-success)' : 'var(--emp-danger)' }}
                                title={isOnline ? 'Connected' : 'Offline'}
                            />
                        </div>
                    </div>
                </div>

                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="emp-theme-toggle"
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDarkMode ? (
                        <SunIcon className="w-5 h-5" />
                    ) : (
                        <MoonIcon className="w-5 h-5" />
                    )}
                </button>
            </header>

            {/* Desktop Header - Only on desktop */}
            <header
                className="hidden lg:flex fixed top-0 left-64 right-0 z-30 h-16 px-8 items-center justify-between"
                style={{
                    background: 'var(--emp-nav-bg)',
                    borderBottom: '1px solid var(--emp-border)',
                    backdropFilter: 'blur(12px)'
                }}
            >
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--emp-text-primary)' }}>
                        {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
                    </h2>
                    <div
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                            background: isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: isOnline ? 'var(--emp-success)' : 'var(--emp-danger)'
                        }}
                    >
                        <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ background: isOnline ? 'var(--emp-success)' : 'var(--emp-danger)' }}
                        />
                        {isOnline ? 'Online' : 'Offline'}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-20 pb-24 px-4 min-h-screen max-w-md mx-auto lg:ml-64 lg:max-w-none lg:pt-24 lg:pb-8 lg:px-8">
                <div className="lg:max-w-4xl">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation - Mobile only */}
            <nav
                className="lg:hidden emp-bottom-nav"
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
                <div className="flex justify-around items-center h-14 max-w-lg mx-auto px-4">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.href)}
                                className={`emp-nav-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon className="w-6 h-6" />
                                <span>{item.name}</span>
                            </button>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
