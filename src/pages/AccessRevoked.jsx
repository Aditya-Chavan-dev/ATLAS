import { motion } from 'framer-motion'
import { ShieldAlert, LogOut, Mail, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AccessRevoked() {
    const { logout, userProfile } = useAuth()

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-slate-900/50 backdrop-blur-2xl border border-red-500/20 rounded-3xl p-8 shadow-2xl shadow-red-500/10 overflow-hidden relative">
                    {/* Top Accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

                    <div className="text-center space-y-6">
                        {/* Icon */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 relative"
                        >
                            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-20" />
                            <ShieldAlert size={40} className="text-red-500" />
                        </motion.div>

                        {/* Text */}
                        <div className="space-y-2">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-3xl font-bold text-white tracking-tight"
                            >
                                Access Revoked
                            </motion.h1>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-slate-400 text-sm leading-relaxed"
                            >
                                Your account <span className="text-slate-200 font-medium">{userProfile?.email}</span> has been designated as <span className="text-red-400 font-medium">Suspended</span> by the administrator.
                            </motion.p>
                        </div>

                        {/* Status Box */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-slate-950/50 rounded-xl p-4 border border-white/5 flex items-center gap-3 text-left"
                        >
                            <Lock size={20} className="text-slate-500" />
                            <div className="flex-1">
                                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Current Status</div>
                                <div className="text-slate-200 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    Restricted Mode
                                </div>
                            </div>
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="pt-4 flex flex-col gap-3"
                        >
                            <button
                                onClick={logout}
                                className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                            >
                                <LogOut size={18} />
                                Sign Out Securely
                            </button>

                            <a
                                href="mailto:admin@autoteknic.com"
                                className="text-slate-500 text-xs hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Mail size={12} /> Contact Support
                            </a>
                        </motion.div>
                    </div>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-8 text-slate-600 text-xs font-mono"
                >
                    SESSION_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} • SECURE_GATEWAY
                </motion.div>
            </motion.div>
        </div>
    )
}
