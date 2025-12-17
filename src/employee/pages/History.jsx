// Enterprise History Page
import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarIcon
} from '@heroicons/react/24/outline'
import StatusBadge from '../components/StatusBadge'

const STATUS_GROUPS = {
    GREEN: ['present', 'approved', 'office', 'site', 'on time', 'work from home'],
    YELLOW: ['pending', 'late', 'half day', 'correction pending', 'clocked out'],
    RED: ['absent', 'rejected']
}

export default function History() {
    const { currentUser } = useAuth()
    const [history, setHistory] = useState([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [loading, setLoading] = useState(true)

    // Formatted Month (e.g., "December 2024")
    const displayMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    useEffect(() => {
        if (!currentUser) return

        setLoading(true)
        const year = currentDate.getFullYear()
        // Pads month with 0 if single digit (e.g. 2024-05) - IMPORTANT for Firebase keys
        const month = String(currentDate.getMonth() + 1).padStart(2, '0')
        const queryPath = `${year}-${month}`

        const historyRef = ref(database, `users/${currentUser.uid}/attendance`)

        const unsubscribe = onValue(historyRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                // Filter entries that match the selected month
                const monthEntries = Object.entries(data)
                    .filter(([date]) => date.startsWith(queryPath))
                    .map(([date, record]) => ({
                        date,
                        ...record
                    }))
                    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort Descending

                setHistory(monthEntries)
            } else {
                setHistory([])
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser, currentDate])

    const changeMonth = (delta) => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + delta)
        setCurrentDate(newDate)
    }

    // Stats Calculation
    const stats = {
        present: history.filter(r => STATUS_GROUPS.GREEN.includes(r.status?.toLowerCase().trim())).length,
        pending: history.filter(r => STATUS_GROUPS.YELLOW.includes(r.status?.toLowerCase().trim())).length,
        late: history.filter(r => r.status?.toLowerCase().trim() === 'late').length
    }



    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-950 font-sans pb-24 transition-colors duration-300">

            {/* Glassmorphic Header */}
            <div className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-slate-200/50 px-6 py-4 flex items-center justify-between transition-all">
                <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-white/50 rounded-full text-slate-500 transition-all active:scale-95"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">{displayMonth}</h2>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Attendance Log</span>
                </div>
                <button
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-white/50 rounded-full text-slate-500 transition-all active:scale-95"
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-6">



                {/* Premium Stats Summary - Glass + Gradient */}
                {/* Stats Summary - Dark Mode Compatible */}
                {!loading && history.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in">
                            <span className="text-2xl font-black text-green-600 dark:text-green-400 mb-1">{stats.present}</span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Present</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in" style={{ animationDelay: '50ms' }}>
                            <span className="text-2xl font-black text-amber-500 dark:text-amber-400 mb-1">{stats.pending}</span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in" style={{ animationDelay: '100ms' }}>
                            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-1">{history.length}</span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total</span>
                        </div>
                    </div>
                )}

                {/* Timeline Feed */}
                {loading ? (
                    <div className="flex flex-col items-center py-12 gap-3 text-slate-400 dark:text-slate-500">
                        <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Loading history...</span>
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <CalendarIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">No records found</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No attendance activity for {displayMonth}.</p>
                    </div>
                ) : (
                    <div className="relative space-y-4 pl-4 border-l-2 border-slate-200 dark:border-slate-800 ml-4">
                        {history.map((record, index) => {
                            const dateObj = new Date(record.date)
                            const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                            const simpleDate = dateObj.getDate()

                            // Status Logic (Normalized)
                            const status = record.status?.toLowerCase().trim() || ''

                            const isGreen = STATUS_GROUPS.GREEN.includes(status)
                            const isYellow = STATUS_GROUPS.YELLOW.includes(status)
                            const isRed = STATUS_GROUPS.RED.includes(status)

                            // Circle Color
                            let circleClass = 'bg-slate-400 ring-slate-200 dark:ring-slate-700' // Default
                            if (isGreen) circleClass = 'bg-green-500 ring-green-100 dark:ring-green-900/30'
                            else if (isYellow) circleClass = 'bg-yellow-400 ring-yellow-100 dark:ring-yellow-900/30'
                            else if (isRed) circleClass = 'bg-red-500 ring-red-100 dark:ring-red-900/30'

                            return (
                                <div
                                    key={record.date}
                                    className="relative flex items-center gap-4 animate-scale-in group"
                                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                                >
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[23px] w-3.5 h-3.5 rounded-full ${circleClass} ring-4 border-2 border-white dark:border-slate-950 transition-all group-hover:scale-110 shadow-sm`}></div>

                                    {/* Card */}
                                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all active:scale-[0.98]">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-center justify-center w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{day}</span>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">{simpleDate}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{record.status}</h3>
                                                        {(status === 'pending' || status === 'correction pending') && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                        <span>{record.locationType || 'Remote'}</span>
                                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                                        <span>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {record.siteName && (
                                            <div className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 inline-flex px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                                📍 {record.siteName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
