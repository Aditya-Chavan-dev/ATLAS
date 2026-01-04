import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import MetricsView from '@/components/owner/MetricsView'
import AdminView from '@/components/owner/AdminView'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, BarChart3, LogOut, ArrowRight, User } from 'lucide-react'
import './MetricsDashboard.css'

function MetricsDashboard() {
    const { currentUser, logout } = useAuth()
    const navigate = useNavigate()
    const [activeSection, setActiveSection] = useState('admin') // 'admin' | 'metrics'
    const [searchTerm, setSearchTerm] = useState('')

    return (
        <div className="metrics-dashboard h-screen overflow-hidden flex flex-col">
            {/* Premium Glass Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="metrics-header shrink-0 z-50 relative"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="flex justify-between items-center h-20 gap-8">
                        {/* Brand & Navigation */}
                        <div className="flex items-center gap-12 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <span className="text-white font-bold text-lg">A</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white tracking-tight">ATLAS</h1>
                                    <span className="text-xs text-indigo-400 font-medium tracking-wider uppercase">Owner Console</span>
                                </div>
                            </div>

                            <nav className="flex bg-slate-800/50 backdrop-blur-md p-1 rounded-xl border border-white/5">
                                {['admin', 'metrics'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveSection(tab)}
                                        className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === tab ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                    >
                                        {activeSection === tab && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-indigo-600 rounded-lg shadow-sm"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-2">
                                            {tab === 'admin' ? <User size={16} /> : <BarChart3 size={16} />}
                                            {tab === 'admin' ? 'Administration' : 'Analytics'}
                                        </span>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Global Search Bar (Only visible in Admin view) */}
                        <div className="flex-1 max-w-md">
                            {activeSection === 'admin' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative group"
                                >
                                    <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <div className="relative bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-xl flex items-center shadow-xl h-10">
                                        <div className="pl-3 text-slate-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-3 pr-4 bg-transparent border-none text-slate-200 placeholder-slate-500 text-sm focus:ring-0 outline-none h-full"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* User Actions */}
                        <div className="flex items-center gap-6 shrink-0">
                            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-800/30 rounded-lg border border-white/5">
                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-sm text-slate-300 font-medium">{currentUser?.email}</span>
                            </div>

                            <div className="h-8 w-px bg-white/10" />

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate('/md/dashboard')}
                                    className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                                >
                                    Go to App <ArrowRight size={16} />
                                </button>
                                <button
                                    onClick={logout}
                                    className="p-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all"
                                    title="Logout"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Main Content Area with Transitions */}
            <main className="flex-1 overflow-hidden relative">
                <div className="h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                        >
                            {activeSection === 'admin' ? (
                                <AdminView currentUser={currentUser} searchTerm={searchTerm} />
                            ) : (
                                <MetricsView />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}

export default MetricsDashboard
