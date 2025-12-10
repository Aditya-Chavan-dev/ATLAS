import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import { requestNotificationPermission, setupForegroundListener } from '../services/fcm'
import {
    HomeIcon,
    CalendarDaysIcon,
    ClockIcon,
    UserIcon
} from '@heroicons/react/24/outline'

export default function EmployeeLayout() {
    const { currentUser } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const { isOnline } = useConnectionStatus()
    const [foregroundNotification, setForegroundNotification] = useState(null)

    // Initialize FCM and request notification permission
    useEffect(() => {
        if (currentUser?.uid) {
            // Request notification permission and save FCM token
            requestNotificationPermission(currentUser.uid)

            // Set up foreground message listener
            const unsubscribe = setupForegroundListener((payload) => {
                // Show in-app notification for foreground messages
                setForegroundNotification({
                    title: payload.notification?.title || 'Notification',
                    body: payload.notification?.body || '',
                    timestamp: Date.now()
                })

                // Auto-hide after 5 seconds
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
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Foreground Notification Toast */}
            {foregroundNotification && (
                <div className="fixed top-4 right-4 z-[100] animate-slide-in-right">
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 max-w-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800">{foregroundNotification.title}</p>
                                <p className="text-sm text-slate-600 mt-0.5">{foregroundNotification.body}</p>
                            </div>
                            <button
                                onClick={() => setForegroundNotification(null)}
                                className="text-slate-400 hover:text-slate-600"
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

            <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col z-40">
                {/* Logo */}
                <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-indigo-200 shadow-lg">
                        A
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">ATLAS</h1>
                        <p className="text-xs text-slate-500">Employee Portal</p>
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
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-2' : ''}`} />
                                <span className="font-medium">{item.name}</span>
                            </button>
                        )
                    })}
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                            {currentUser?.displayName?.charAt(0) || 'E'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                                {currentUser?.displayName || 'Employee'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header - Hidden on desktop */}
            <header className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 h-16 px-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-indigo-200 shadow-lg">
                        A
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-slate-800 leading-tight">
                            {currentUser?.displayName || 'Employee'}
                        </h1>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">ATLAS</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} title={isOnline ? 'Connected' : 'Offline'} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                </div>
            </header>

            {/* Desktop Header - Only on desktop */}
            <header className="hidden lg:flex fixed top-0 left-64 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 h-16 px-8 items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
                    </h2>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        {isOnline ? 'Online' : 'Offline'}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                </div>
            </header>

            {/* Main Content */}
            <main className="
                pt-20 pb-24 px-4 min-h-screen
                max-w-md mx-auto
                lg:ml-64 lg:max-w-none lg:pt-24 lg:pb-8 lg:px-8
            ">
                <div className="lg:max-w-4xl">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation - Mobile only */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
                <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.href)}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} />
                                <span className="text-[10px] font-medium">{item.name}</span>
                            </button>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
