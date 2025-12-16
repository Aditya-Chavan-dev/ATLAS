// ATLAS Enterprise Layout
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
    Squares2X2Icon,
    CalendarIcon,
    ClipboardDocumentIcon,
    UserIcon
} from '@heroicons/react/24/outline'
import {
    Squares2X2Icon as Squares2X2IconSolid,
    CalendarIcon as CalendarIconSolid,
    ClipboardDocumentIcon as ClipboardDocumentIconSolid,
    UserIcon as UserIconSolid
} from '@heroicons/react/24/solid'

export default function EmployeeLayout() {
    const navigate = useNavigate()
    const location = useLocation()

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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Main Content Area */}
            {/* Removed top header as per "Greeting Header" design in Dashboard pages */}
            <main className="flex-1 pb-24 safe-area-bottom">
                <Outlet />
            </main>

            {/* Enterprise Bottom Navigation - Fixed Height 64px */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex justify-around items-center z-50 safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                {navigation.map((item) => {
                    const isActive = location.pathname.startsWith(item.href)
                    const Icon = isActive ? item.activeIcon : item.icon

                    return (
                        <button
                            key={item.name}
                            onClick={() => handleNavClick(item.href)}
                            className="group flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform duration-150"
                        >
                            <Icon
                                className={`w-6 h-6 mb-1 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                                    }`}
                            />
                            <span
                                className={`text-[10px] transition-all duration-200 ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
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
