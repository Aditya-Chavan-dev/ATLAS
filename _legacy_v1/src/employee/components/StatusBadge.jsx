import { ATTENDANCE_STATUS, ATTENDANCE_LABELS, LOCATION_TYPE } from '@/config/vocabulary';

export default function StatusBadge({ status, type = 'pill' }) {
    // Normalize status to lowercase for comparison
    const normalizedStatus = status?.toLowerCase?.();

    const config = {
        [ATTENDANCE_STATUS.PRESENT]: { bg: 'bg-green-100', text: 'text-green-700', label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.PRESENT] },
        [ATTENDANCE_STATUS.LATE]: { bg: 'bg-amber-100', text: 'text-amber-700', label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.LATE] },
        [ATTENDANCE_STATUS.ABSENT]: { bg: 'bg-red-100', text: 'text-red-700', label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.ABSENT] },
        [ATTENDANCE_STATUS.PENDING]: { bg: 'bg-blue-100', text: 'text-blue-700', label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.PENDING] },
        [ATTENDANCE_STATUS.APPROVED]: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.APPROVED] },
        [ATTENDANCE_STATUS.REJECTED]: { bg: 'bg-red-100', text: 'text-red-700', label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.REJECTED] },
        [LOCATION_TYPE.SITE]: { bg: 'bg-orange-100', text: 'text-orange-800', label: LOCATION_TYPE.SITE },
        [LOCATION_TYPE.OFFICE]: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: LOCATION_TYPE.OFFICE }
    };

    // Default fallback for unmapped statuses
    const style = config[normalizedStatus] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status || 'Unknown' };


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
