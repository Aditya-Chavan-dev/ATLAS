import { motion } from 'framer-motion'
import { Bell, X, CheckCircle } from 'lucide-react'

const FloatingNotification = ({ title, body, icon, actionLabel, onAction, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -100, x: '-50%', scale: 0.95 }}
            animate={{ opacity: 1, y: 20, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md"
        >
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-4 flex items-start gap-4">
                    {/* Icon Container */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                        {icon || <Bell className="w-6 h-6" />}
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight truncate">
                            {title || 'Notification'}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 line-clamp-2">
                            {body}
                        </p>

                        {/* Actions */}
                        {actionLabel && (
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => {
                                        onAction?.()
                                        onClose()
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {actionLabel}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Bar (Timer) */}
                <motion.div
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: 8, ease: "linear" }}
                    className="h-1 bg-indigo-600 origin-left"
                />
            </div>
        </motion.div>
    )
}

export default FloatingNotification
