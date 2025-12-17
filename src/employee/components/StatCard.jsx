
export default function StatCard({ label, value, type = 'neutral', icon: Icon, delay = 0, compact = false }) {
    const colors = {
        present: 'text-green-600',
        late: 'text-amber-600',
        absent: 'text-red-600',
        neutral: 'text-slate-900'
    }

    return (
        <div
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center shadow-sm animate-scale-in transition-colors ${compact ? 'p-2' : 'p-4'}`}
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
        >
            {Icon && <Icon className="w-5 h-5 text-slate-400 mb-2" />}
            <span className={`font-bold ${colors[type] || colors.neutral} ${compact ? 'text-lg' : 'text-2xl'}`}>
                {value}
            </span>
            <span className={`text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mt-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {label}
            </span>
        </div>
    )
}
