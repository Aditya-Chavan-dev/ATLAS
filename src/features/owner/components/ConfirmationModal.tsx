import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    primaryAction?: {
        label: string;
        onClick: () => void;
    } | null;
    secondaryAction?: {
        label: string;
        onClick: () => void;
    } | null;
}

export function ConfirmationModal({ isOpen, onClose, title, message, type = 'info', primaryAction, secondaryAction }: ModalProps) {
    if (!isOpen) return null;

    const colors = {
        info: 'bg-blue-600 hover:bg-blue-700',
        success: 'bg-emerald-600 hover:bg-emerald-700',
        warning: 'bg-amber-600 hover:bg-amber-700',
        error: 'bg-red-600 hover:bg-red-700'
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal / Bottom Sheet Content */}
                <motion.div
                    initial={{ y: '100%', opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: '100%', opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden relative z-10 mx-auto"
                >
                    {/* Handle for resizing indication (Mobile only) */}
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 sm:hidden" />

                    <div className="p-6 pt-2 sm:pt-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900 pr-8">{title}</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 p-2 -mr-2 -mt-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-8 font-medium leading-relaxed">{message}</p>

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pb-safe-bottom">
                            {secondaryAction && (
                                <button
                                    onClick={secondaryAction.onClick}
                                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-gray-700 font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors min-h-[48px]"
                                >
                                    {secondaryAction.label}
                                </button>
                            )}
                            {primaryAction && (
                                <button
                                    onClick={primaryAction.onClick}
                                    className={`w-full sm:w-auto px-6 py-3.5 rounded-xl text-white font-bold shadow-lg transition-all min-h-[48px] active:scale-95 ${colors[type]}`}
                                >
                                    {primaryAction.label}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
