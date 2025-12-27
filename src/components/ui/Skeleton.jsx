/**
 * SKELETON LOADERS
 * Animated placeholder components for loading states.
 * Provides better perceived performance than spinners.
 * 
 * FAANG Principle: "Make the app feel instant."
 */

// Base Skeleton with shimmer animation
export function Skeleton({ className = '', variant = 'rectangle' }) {
    const baseClasses = 'animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%]'

    const variantClasses = {
        rectangle: 'rounded',
        circle: 'rounded-full',
        text: 'rounded h-4',
        card: 'rounded-xl',
    }

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant] || variantClasses.rectangle} ${className}`}
            aria-hidden="true"
        />
    )
}

// Skeleton for User/Employee Cards
export function UserCardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <Skeleton variant="circle" className="w-12 h-12 flex-shrink-0" />

                {/* Content */}
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>

                {/* Action Button */}
                <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
        </div>
    )
}

// Skeleton for Table Rows
export function TableRowSkeleton({ columns = 5 }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    )
}

// Skeleton for Stats Cards
export function StatsCardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
        </div>
    )
}

// Skeleton for Dashboard Grid
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <Skeleton className="h-6 w-48 mb-6" />
                <div className="space-y-4">
                    <UserCardSkeleton />
                    <UserCardSkeleton />
                    <UserCardSkeleton />
                </div>
            </div>
        </div>
    )
}

// Skeleton for Profile Page
export function ProfileSkeleton() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-6 mb-6">
                <Skeleton variant="circle" className="w-24 h-24" />
                <div className="space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
            </div>
        </div>
    )
}

// Skeleton for List Items
export function ListSkeleton({ count = 5 }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg">
                    <Skeleton variant="circle" className="w-10 h-10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Skeleton
