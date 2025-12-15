import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, ChevronRight, LayoutDashboard, FileCheck, Users, Contact, UserCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { clsx } from 'clsx'

export default function Sidebar({ isOpen, setIsOpen, isMobile }) {
    const { logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const menuItems = [
        { path: '/md/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/md/approvals', label: 'Approvals', icon: FileCheck },
        { path: '/md/employees', label: 'Team', icon: Users },
        { path: '/md/profiles', label: 'Profiles', icon: Contact },
        // { path: '/md/export', label: 'Export', icon: Download }, // Optional if needed
    ]

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/')
        } catch (error) {
            console.error('Logout failed', error)
        }
    }

    const sidebarVariants = {
        open: {
            width: isMobile ? '100%' : '280px',
            x: 0,
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        },
        closed: {
            width: isMobile ? '0px' : '88px', // Mini sidebar on desktop, hidden on mobile
            x: isMobile ? '-100%' : 0,
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        }
    }

    // On mobile, close sidebar when clicking a link
    const handleLinkClick = () => {
        if (isMobile) setIsOpen(false)
    }

    return (
        <AnimatePresence>
            <motion.aside
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                variants={sidebarVariants}
                className={clsx(
                    "fixed left-0 top-0 h-full z-40 flex flex-col bg-white border-r border-slate-100 shadow-2xl overflow-hidden",
                    // Glass effect for refined look
                    "bg-white/90 backdrop-blur-xl"
                )}
            >
                {/* Logo Section */}
                <div className="h-20 flex items-center px-6 border-b border-slate-100/50">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20 mr-4">
                        <span className="text-white font-bold text-xl">A</span>
                    </div>
                    {/* Hide text when collapsed on desktop */}
                    {(!isMobile && !isOpen) ? null : (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-display font-bold text-2xl text-slate-800 tracking-tight"
                        >
                            ATLAS
                        </motion.span>
                    )}

                    {/* Mobile Close Button */}
                    {isMobile && (
                        <button
                            onClick={() => setIsOpen(false)}
                            className="ml-auto p-2 rounded-full hover:bg-slate-100 text-slate-500"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname.startsWith(item.path)

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleLinkClick}
                                className={clsx(
                                    "flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-brand-primary"
                                )}
                            >
                                <Icon
                                    size={22}
                                    className={clsx(
                                        "min-w-[22px]",
                                        isActive ? "text-white" : "group-hover:text-brand-primary"
                                    )}
                                />

                                <span className={clsx(
                                    "ml-4 font-medium whitespace-nowrap origin-left transition-all duration-200",
                                    (!isMobile && !isOpen) ? "opacity-0 w-0 overflow-hidden ml-0" : "opacity-100"
                                )}>
                                    {item.label}
                                </span>

                                {/* Hover tooltip for mini sidebar */}
                                {(!isMobile && !isOpen) && (
                                    <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* User / Logout Section */}
                <div className="p-4 border-t border-slate-100/50">
                    <button
                        onClick={handleLogout}
                        className={clsx(
                            "w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200",
                            "text-slate-500 hover:bg-red-50 hover:text-red-600 group"
                        )}
                    >
                        <LogOut size={22} className="min-w-[22px]" />
                        <span className={clsx(
                            "ml-4 font-medium whitespace-nowrap transition-all duration-200",
                            (!isMobile && !isOpen) ? "opacity-0 w-0 overflow-hidden ml-0" : "opacity-100"
                        )}>
                            Logout
                        </span>
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30"
                />
            )}
        </AnimatePresence>
    )
}
