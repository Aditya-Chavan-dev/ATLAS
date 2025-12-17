// ATLAS Enterprise Layout
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import RefinedModal from '../components/ui/RefinedModal'
import {
    Squares2X2Icon,
    CalendarIcon,
    ClipboardDocumentIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    SunIcon,
    MoonIcon
} from '@heroicons/react/24/outline'
import {
    Squares2X2Icon as Squares2X2IconSolid,
    CalendarIcon as CalendarIconSolid,
    ClipboardDocumentIcon as ClipboardDocumentIconSolid,
    UserIcon as UserIconSolid
} from '@heroicons/react/24/solid'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function EmployeeLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout } = useAuth()
    const { theme, toggleTheme } = useTheme()

    const navigation = [
        { name: 'Home', href: '/dashboard', icon: Squares2X2Icon, activeIcon: Squares2X2IconSolid },
        { name: 'History', href: '/history', icon: CalendarIcon, activeIcon: CalendarIconSolid },
        { name: 'Leave', href: '/leave', icon: ClipboardDocumentIcon, activeIcon: ClipboardDocumentIconSolid },
        { name: 'Profile', href: '/profile', icon: UserIcon, activeIcon: UserIconSolid },
    ]

    const handleNavClick = (href) => {
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10)
        navigate(href)
    }

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        primaryAction: null,
        secondaryAction: null
    })

    const handleLogout = () => {
        setModalConfig({
            isOpen: true,
            title: 'Sign Out',
            message: 'Are you sure you want to log out of ATLAS?',
            type: 'warning',
            primaryAction: {
                label: 'Sign Out',
                onClick: async () => {
                    await logout()
                    navigate('/login')
                    setModalConfig(prev => ({ ...prev, isOpen: false }))
                }
            },
            secondaryAction: {
                label: 'Cancel',
                onClick: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            },
            onClose: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col lg:flex-row font-sans">
            <RefinedModal
                isOpen={modalConfig.isOpen}
                onClose={modalConfig.onClose}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                primaryAction={modalConfig.primaryAction}
                secondaryAction={modalConfig.secondaryAction}
            />

            {/* --- Desktop Sidebar (Hidden on Mobile) --- */}
            <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed inset-y-0 z-50 transition-colors duration-300">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <h1 className="text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tighter">ATLAS</h1>
                    <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mt-1">Enterprise Portal</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navigation.map((item) => {
                        const isActive = location.pathname.startsWith(item.href)
                        const Icon = isActive ? item.activeIcon : item.icon

                        return (
                            <button
                                key={item.name}
                                onClick={() => handleNavClick(item.href)}
                                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 text-sm font-medium ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm shadow-blue-100 dark:shadow-none'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                                {item.name}
                            </button>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium"
                    >
                        {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm font-medium"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* --- Main Content Area --- */}
            {/* Added lg:ml-64 to push content when sidebar is visible */}
            <main className="flex-1 pb-24 lg:pb-0 lg:ml-64 min-w-0">
                {/* Max-width container for large screens to prevent stretching */}
                <div className="max-w-5xl mx-auto w-full h-full">
                    <Outlet />
                </div>
            </main>

            {/* --- Mobile Bottom Navigation (Hidden on Desktop) --- */}
            <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl flex justify-around items-center z-50 safe-area-pb shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-slate-900/5 dark:ring-white/10">
                {navigation.map((item) => {
                    const isActive = location.pathname.startsWith(item.href)
                    const Icon = isActive ? item.activeIcon : item.icon

                    return (
                        <button
                            key={item.name}
                            onClick={() => handleNavClick(item.href)}
                            className="group flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform duration-150 relative"
                        >
                            {/* Active Indicator Dot */}
                            {isActive && (
                                <span className="absolute -top-1 w-1 h-1 bg-blue-600 dark:bg-blue-500 rounded-full animate-scale-in" />
                            )}

                            <Icon
                                className={`w-6 h-6 mb-1 transition-colors duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                                    }`}
                            />
                            <span
                                className={`text-[10px] transition-all duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500 font-medium'
                                    }`}
                            >
                                {item.name}
                            </span>
                        </button>
                    )
                })}
                <button
                    onClick={toggleTheme}
                    className="flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform duration-150 relative text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                    {theme === 'dark' ? <SunIcon className="w-6 h-6 mb-1" /> : <MoonIcon className="w-6 h-6 mb-1" />}
                    <span className="text-[10px] font-medium">Theme</span>
                </button>
            </nav>
        </div>
    )
}
