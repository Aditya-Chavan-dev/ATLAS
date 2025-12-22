import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { BarChart3, Clock, CheckSquare, Users, FileText, LogOut, Sun, Moon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

export default function MDLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

    const navigation = [
        { name: 'Dashboard', href: '/md/dashboard', icon: BarChart3 },
        { name: 'History', href: '/md/history', icon: Clock },
        { name: 'Approvals', href: '/md/approvals', icon: CheckSquare },
        { name: 'Staff', href: '/md/employees', icon: Users },
        { name: 'Reports', href: '/md/export', icon: FileText },
    ]

    const handleNavClick = (href) => {
        if (navigator.vibrate) navigator.vibrate(10)
        navigate(href)
    }

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true)
    }

    const confirmLogout = async () => {
        await logout()
        setIsLogoutModalOpen(false)
        navigate('/login')
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
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
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
                        onClick={handleLogoutClick}
                        className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* --- Main Content Area --- */}
            {/* Added lg:ml-64 to push content when sidebar is visible */}
            <main className="flex-1 lg:ml-64 min-w-0 h-full overflow-y-auto pb-24 lg:pb-0 bg-slate-50 dark:bg-slate-950">
                <div className="max-w-6xl mx-auto w-full h-full p-4 lg:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* --- Mobile Bottom Navigation (Glassy Dock) --- */}
            <nav className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl flex justify-around items-center px-2 py-2">
                    {navigation.map((item) => {
                        const isActive = location.pathname.startsWith(item.href)
                        const Icon = item.icon

                        return (
                            <button
                                key={item.name}
                                onClick={() => handleNavClick(item.href)}
                                className={`relative p-3 rounded-xl transition-all duration-300 ease-spring ${isActive
                                    ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/30'
                                    : 'text-slate-500 dark:text-slate-400 hover:scale-105'
                                    }`}
                            >
                                <Icon className="w-6 h-6" />
                                {isActive && (
                                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
                                )}
                            </button>
                        )
                    })}
                    <button
                        onClick={handleLogoutClick}
                        className="relative p-3 rounded-xl transition-all duration-300 ease-spring text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>
            </nav>

            {/* Logout Confirmation Modal */}
            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title="Sign Out"
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsLogoutModalOpen(false)}>Cancel</Button>
                        <Button variant="danger-solid" onClick={confirmLogout} icon={LogOut}>Sign Out</Button>
                    </>
                }
            >
                <p className="text-slate-600 dark:text-slate-300">
                    Are you sure you want to sign out of the console?
                </p>
            </Modal>
        </div>
    )
}
