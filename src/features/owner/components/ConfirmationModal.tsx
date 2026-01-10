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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100"
                >
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-8">{message}</p>

                        <div className="flex justify-end gap-3">
                            {secondaryAction && (
                                <button
                                    onClick={secondaryAction.onClick}
                                    className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                                >
                                    {secondaryAction.label}
                                </button>
                            )}
                            {primaryAction && (
                                <button
                                    onClick={primaryAction.onClick}
                                    className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-all ${colors[type]}`}
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
