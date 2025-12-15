import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export default function Button({
    children,
    className,
    variant = 'primary', // primary, secondary, ghost, danger, glass
    size = 'md', // sm, md, lg
    isLoading = false,
    disabled,
    icon: Icon,
    ...props
}) {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"

    const variants = {
        primary: "bg-brand-primary text-white shadow-lg shadow-brand-primary/30 hover:bg-brand-dark hover:shadow-brand-primary/50 focus:ring-brand-primary",
        secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-200",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500",
        glass: "bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
    }

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    }

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : Icon ? (
                <Icon className="w-4 h-4 mr-2" />
            ) : null}
            {children}
        </motion.button>
    )
}
