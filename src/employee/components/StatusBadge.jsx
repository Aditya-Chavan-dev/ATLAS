
export default function StatusBadge({ status, type = 'pill' }) {
    const config = {
        Present: { bg: 'bg-green-100', text: 'text-green-700', label: 'Present' },
        Late: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Late' },
        Absent: { bg: 'bg-red-100', text: 'text-red-700', label: 'Absent' },
        Pending: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pending' },
        Approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved' },
        Rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
        Site: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Site' },
        Office: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Office' }
    }

    // Default fallback
    const style = config[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status || 'Unknown' }

    if (type === 'dot') {
        return (
            <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${style.bg.replace('bg-', 'bg-').replace('100', '500')}`} />
                <span className={`text-sm ${style.text}`}>{style.label}</span>
            </div>
        )
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    )
}
