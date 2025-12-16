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
        present: history.filter(r => r.status === 'Present').length,
        pending: history.filter(r => r.status === 'Pending').length,
        late: history.filter(r => r.status === 'Late').length
    }

    return (
        <div className="min-h-full bg-slate-50 font-sans p-6 pb-24 animate-fade-in">
            {/* Header / Config Bar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 sticky top-20 z-10 md:static">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-full text-slate-500 transition-colors">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{displayMonth}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-full text-slate-500 transition-colors">
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Monthly Stats Summary */}
            {!loading && history.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-3 rounded-xl border border-green-100 shadow-sm flex flex-col items-center">
                        <span className="text-2xl font-bold text-green-600">{stats.present}</span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Present</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center">
                        <span className="text-2xl font-bold text-amber-500">{stats.pending}</span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center">
                        <span className="text-2xl font-bold text-brand-primary">{history.length}</span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</span>
                    </div>
                </div>
            )}

            {/* List View */}
            {loading ? (
                <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
                    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Loading history...</span>
                </div>
            ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <CalendarIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-900">No records found</p>
                    <p className="text-sm text-slate-500 mt-1">No attendance activity for {displayMonth}.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((record, index) => {
                        const dateObj = new Date(record.date)
                        const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' }) // Mon, Tue
                        const simpleDate = dateObj.getDate() // 12

                        // Status Colors
                        const isPresent = record.status === 'Present'
                        const isPending = record.status === 'Pending'
                        const statusColor = isPresent ? 'bg-green-500' : isPending ? 'bg-amber-500' : 'bg-red-500'
                        const borderColor = isPresent ? 'border-l-green-500' : isPending ? 'border-l-amber-500' : 'border-l-red-500'

                        return (
                            <div
                                key={record.date}
                                className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${borderColor} border-y border-r border-slate-100 flex items-center gap-4 animate-scale-in hover:shadow-md transition-shadow`}
                                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                            >
                                {/* Date Box */}
                                <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-50 rounded-lg min-w-[3rem]">
                                    <span className="text-xs font-bold text-slate-500 uppercase">{day}</span>
                                    <span className="text-lg font-bold text-slate-900 leading-none">{simpleDate}</span>
                                </div>

                                {/* Details */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                                            <h3 className="font-semibold text-slate-900">{record.status}</h3>
                                        </div>
                                        <div className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                            {record.locationType || 'Remote'}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <span>⏰ {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="truncate max-w-[120px]">
                                            {record.siteName || record.location || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
