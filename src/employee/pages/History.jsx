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

    // Weekly Strip Logic (Static for visual flair for now, centered on 'today' or first of month)
    const getWeekDays = () => {
        const today = new Date()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Start Mon

        return Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(startOfWeek)
            day.setDate(startOfWeek.getDate() + i)
            return day
        })
    }
    const weekDays = getWeekDays()

    return (
        <div className="min-h-full bg-slate-50 font-sans pb-24">

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

                {/* Weekly Strip Decoration */}
                <div className="flex justify-between items-center overflow-x-auto pb-2 no-scrollbar">
                    {weekDays.map((day, i) => {
                        const isToday = day.toDateString() === new Date().toDateString()
                        return (
                            <div key={i} className={`flex flex-col items-center min-w-[3rem] p-2 rounded-xl border transition-all ${isToday
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                    : 'bg-white border-slate-100 text-slate-400 opacity-70'
                                }`}>
                                <span className="text-[10px] font-bold uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}</span>
                                <span className={`text-sm font-bold ${isToday ? 'text-white' : 'text-slate-600'}`}>{day.getDate()}</span>
                            </div>
                        )
                    })}
                </div>

                {/* Premium Stats Summary - Glass + Gradient */}
                {!loading && history.length > 0 && (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 shadow-xl shadow-blue-200 md:grid md:grid-cols-3 md:gap-8 flex justify-between items-center text-white">

                        <div className="flex flex-col items-center relative z-10">
                            <span className="text-3xl font-bold tracking-tighter">{stats.present}</span>
                            <span className="text-xs font-medium text-blue-100 uppercase tracking-wide">Present</span>
                        </div>

                        <div className="w-[1px] h-8 bg-white/20 md:hidden"></div>

                        <div className="flex flex-col items-center relative z-10">
                            <span className="text-3xl font-bold tracking-tighter text-amber-300">{stats.pending}</span>
                            <span className="text-xs font-medium text-blue-100 uppercase tracking-wide">Pending</span>
                        </div>

                        <div className="w-[1px] h-8 bg-white/20 md:hidden"></div>

                        <div className="flex flex-col items-center relative z-10">
                            <span className="text-3xl font-bold tracking-tighter">{history.length}</span>
                            <span className="text-xs font-medium text-blue-100 uppercase tracking-wide">Total</span>
                        </div>

                        {/* Decimal Decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <CalendarIcon className="w-32 h-32 transform rotate-12 translate-x-8 -translate-y-8" />
                        </div>
                    </div>
                )}

                {/* Timeline Feed */}
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
                    <div className="relative space-y-6 pl-4 border-l-2 border-slate-100 ml-4">
                        {history.map((record, index) => {
                            const dateObj = new Date(record.date)
                            const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                            const simpleDate = dateObj.getDate()

                            const isPresent = record.status === 'Present'
                            const isPending = record.status === 'Pending'

                            // Dot Color
                            const dotColor = isPresent ? 'bg-green-500 ring-green-100' : isPending ? 'bg-amber-500 ring-amber-100' : 'bg-red-500 ring-red-100'

                            return (
                                <div
                                    key={record.date}
                                    className="relative flex items-center gap-4 animate-scale-in group"
                                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                                >
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[25px] w-4 h-4 rounded-full ${dotColor} ring-4 border-2 border-white transition-all group-hover:scale-110`}></div>

                                    {/* Card */}
                                    <div className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-[0.98]">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-center justify-center w-10 h-10 bg-slate-50 rounded-lg">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{day}</span>
                                                    <span className="text-sm font-bold text-slate-800 leading-none">{simpleDate}</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-sm">{record.status}</h3>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <span>{record.locationType || 'Remote'}</span>
                                                        <span>•</span>
                                                        <span>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <StatusBadge status={record.status} size="sm" />
                                            {/* Note: Update StatusBadge to accept size or just keep default */}
                                        </div>

                                        {record.siteName && (
                                            <div className="mt-2 text-xs font-medium text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded">
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
