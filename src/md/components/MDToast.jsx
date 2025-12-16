
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'

export default function MDToast({ message, type = 'info', onClose, duration = 3000 }) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // Slide down animation on mount
        requestAnimationFrame(() => setVisible(true))

        if (duration) {
            const timer = setTimeout(() => {
                setVisible(false)
                setTimeout(onClose, 300) // Wait for exit animation
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [duration, onClose])

    const styles = {
        success: { border: 'border-green-500', icon: CheckCircleIcon, color: 'text-green-500' },
        error: { border: 'border-red-500', icon: ExclamationCircleIcon, color: 'text-red-500' },
        info: { border: 'border-blue-500', icon: InformationCircleIcon, color: 'text-blue-500' },
        warning: { border: 'border-amber-500', icon: ExclamationCircleIcon, color: 'text-amber-500' }
    }

    const currentStyle = styles[type] || styles.info
    const Icon = currentStyle.icon

    return (
        <div
            className={`fixed top-20 right-6 z-[100] w-full max-w-sm transition-all duration-300 ease-out transform ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
        >
            <div className={`bg-white dark:bg-slate-800 shadow-xl rounded-lg border-l-4 ${currentStyle.border} p-4 flex items-start gap-3`}>
                <Icon className={`w-6 h-6 ${currentStyle.color} flex-shrink-0`} />
                <div className="flex-1 pt-0.5">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{message}</p>
                </div>
                <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}
