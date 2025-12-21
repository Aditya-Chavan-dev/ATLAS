import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, History, CheckSquare, Users, FileBarChart, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function MDLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout } = useAuth()
    const { theme, toggleTheme } = useTheme()

    const navigation = [
        { name: 'Dashboard', href: '/md/dashboard', icon: LayoutDashboard, activeIcon: LayoutDashboard },
        { name: 'History', href: '/md/history', icon: History, activeIcon: History },
        { name: 'Approvals', href: '/md/approvals', icon: CheckSquare, activeIcon: CheckSquare },
        { name: 'Team', href: '/md/employees', icon: Users, activeIcon: Users },
        { name: 'Reports', href: '/md/export', icon: FileBarChart, activeIcon: FileBarChart },
    ]

    const handleNavClick = (href) => {
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
        <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col lg:flex-row font-sans">

            {/* --- Desktop Sidebar (Hidden on Mobile) --- */}
            <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed inset-y-0 z-50 transition-colors duration-300">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <h1 className="text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tighter">ATLAS</h1>
                    <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mt-1">MD Console</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navigation.map((item) => {
                        const isActive = location.pathname.startsWith(item.href)
                        const Icon = item.icon

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
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* --- Main Content Area --- */}
            {/* Added lg:ml-64 to push content when sidebar is visible */}
            <main className="flex-1 lg:ml-64 min-w-0 h-full overflow-y-auto pb-24 lg:pb-0">
                <div className="max-w-6xl mx-auto w-full h-full p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>

            {/* --- Mobile Bottom Navigation (Hidden on Desktop) --- */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[safe-area-inset-bottom-plus-4rem] pb-[safe-area-inset-bottom] bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2">
                {navigation.map((item) => {
                    const isActive = location.pathname.startsWith(item.href)
                    const Icon = item.icon

                    return (
                        <button
                            key={item.name}
                            onClick={() => handleNavClick(item.href)}
                            className={`group flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ${isActive ? 'flex-grow px-2' : ''}`}
                        >
                            {/* Active Indicator Splash */}
                            {isActive && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl -z-10 animate-scale-in" />
                            )}

                            <Icon
                                className={`w-6 h-6 transition-all duration-300 ${isActive
                                    ? 'text-blue-600 dark:text-blue-400 -translate-y-1'
                                    : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                                    }`}
                            />

                            {/* Label - Only shown when active or always small? 
                                User said "congested". Showing text only for active is cleaner. 
                                Or simply smaller text.
                                Let's show text ONLY for active item to save space.
                            */}
                            <span
                                className={`text-[10px] font-bold absolute bottom-2 transition-all duration-300 transform ${isActive
                                    ? 'opacity-100 translate-y-0 text-blue-600 dark:text-blue-400'
                                    : 'opacity-0 translate-y-2 pointer-events-none'
                                    }`}
                            >
                                {item.name}
                            </span>
                        </button>
                    )
                })}
                {/* Mobile Logout (5th Item) - Simplied to just Icon */}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform duration-150 relative text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 group"
                >
                    <LogOut className="w-6 h-6 group-hover:text-red-500 transition-colors" />
                </button>
            </nav>
        </div>
    )
}
