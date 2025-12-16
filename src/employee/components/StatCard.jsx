
export default function StatCard({ label, value, type = 'neutral', icon: Icon, delay = 0 }) {
    const colors = {
        present: 'text-green-600',
        late: 'text-amber-600',
        absent: 'text-red-600',
        neutral: 'text-slate-900'
    }

    return (
        <div
            className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center shadow-sm animate-scale-in"
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
        >
            {Icon && <Icon className="w-5 h-5 text-slate-400 mb-2" />}
            <span className={`text-2xl font-bold ${colors[type] || colors.neutral}`}>
                {value}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-wide font-medium mt-1">
                {label}
            </span>
        </div>
    )
}
