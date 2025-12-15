import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export default function Badge({
    children,
    className,
    variant = 'default', // default, success, warning, danger, brand
    ...props
}) {
    const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"

    const variants = {
        default: "bg-slate-100 text-slate-800",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
        warning: "bg-amber-50 text-amber-700 border border-amber-100",
        danger: "bg-red-50 text-red-700 border border-red-100",
        brand: "bg-brand-light text-brand-primary border border-brand-primary/20",
        neutral: "bg-slate-50 text-slate-600 border border-slate-200"
    }

    return (
        <span className={cn(baseStyles, variants[variant], className)} {...props}>
            {children}
        </span>
    )
}
