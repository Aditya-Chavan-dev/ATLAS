// ATLAS Enterprise Layout
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
    Squares2X2Icon,
    CalendarIcon,
    ClipboardDocumentIcon,
    UserIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import {
    Squares2X2Icon as Squares2X2IconSolid,
    CalendarIcon as CalendarIconSolid,
    ClipboardDocumentIcon as ClipboardDocumentIconSolid,
    UserIcon as UserIconSolid
} from '@heroicons/react/24/solid'
import { useAuth } from '../context/AuthContext'

export default function EmployeeLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout } = useAuth()

    const navigation = [
        { name: 'Home', href: '/dashboard', icon: Squares2X2Icon, activeIcon: Squares2X2IconSolid },
        { name: 'History', href: '/history', icon: CalendarIcon, activeIcon: CalendarIconSolid },
        { name: 'Leave', href: '/leave', icon: ClipboardDocumentIcon, activeIcon: ClipboardDocumentIconSolid },
        { name: 'Profile', href: '/profile', icon: UserIcon, activeIcon: UserIconSolid },
    ]

    const handleNavClick = (href) => {
        // Haptic feedback (subtle vibration on mobile)
        if (navigator.vibrate) navigator.vibrate(10)
        navigate(href)
    }

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await logout()
            navigate('/login')
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">

            {/* --- Desktop Sidebar (Hidden on Mobile) --- */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 z-50">
                <div className="p-6 border-b border-slate-100 mb-2">
                    <h1 className="text-2xl font-black text-blue-600 tracking-tighter">ATLAS</h1>
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
                                        ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                {item.name}
                            </button>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* --- Main Content Area --- */}
            {/* Added md:ml-64 to push content when sidebar is visible */}
            <main className="flex-1 pb-24 md:pb-0 md:ml-64 min-w-0">
                {/* Max-width container for large screens to prevent stretching */}
                <div className="max-w-5xl mx-auto w-full h-full">
                    <Outlet />
                </div>
            </main>

            {/* --- Mobile Bottom Navigation (Hidden on Desktop) --- */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl flex justify-around items-center z-50 safe-area-pb shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-slate-900/5">
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
                                <span className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full animate-scale-in" />
                            )}

                            <Icon
                                className={`w-6 h-6 mb-1 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                                    }`}
                            />
                            {/* Label only visible on active or hover? No, keep it clean. Maybe just icon? Let's keep label for clarity but small */}
                            <span
                                className={`text-[10px] transition-all duration-200 ${isActive ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
                                    }`}
                            >
                                {item.name}
                            </span>
                        </button>
                    )
                })}
            </nav>
        </div>
    )
}
