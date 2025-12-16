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

    return (
        <div className="min-h-full bg-slate-50 font-sans p-6 pb-24">
            {/* Header / Config Bar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 sticky top-20 z-10 md:static">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-slate-900">{displayMonth}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>

            {/* List View */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading history...</div>
            ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CalendarIcon className="w-16 h-16 text-slate-200 mb-4" />
                    <p className="text-lg font-medium text-slate-900">No records found</p>
                    <p className="text-sm text-slate-500">No attendance records for this month.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((record, index) => {
                        const dateObj = new Date(record.date)
                        const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
                        const simpleDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                        return (
                            <div
                                key={record.date}
                                className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col gap-2 animate-scale-in"
                                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{simpleDate}, {dateObj.getFullYear()}</h3>
                                        <div className="text-xs text-slate-500">{day}</div>
                                    </div>
                                    <StatusBadge status={record.status} />
                                </div>

                                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100 mt-1">
                                    <span className="text-slate-600 font-medium">
                                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-slate-500 truncate max-w-[150px] text-right">
                                        {record.locationType === 'Office' ? 'Office' : `Site: ${record.siteName || 'Unknown'}`}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
