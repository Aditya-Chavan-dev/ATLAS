import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export default function Card({
    children,
    className,
    variant = 'default', // default, glass, neomorphic
    hover = true,
    onClick,
    ...props
}) {
    const baseStyles = "rounded-2xl transition-all duration-300 border"

    const variants = {
        default: "bg-white border-slate-100 shadow-sm",
        glass: "bg-white/70 backdrop-blur-lg border-white/20 shadow-glass",
        neomorphic: "bg-bg-ground shadow-neu border-transparent"
    }

    const hoverStyles = hover ? "hover:-translate-y-1 hover:shadow-lg" : ""

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(baseStyles, variants[variant], hoverStyles, className)}
            onClick={onClick}
            {...props}
        >
            {children}
        </motion.div>
    )
}
