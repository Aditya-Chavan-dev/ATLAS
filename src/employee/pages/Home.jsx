// Enterprise Dashboard
import { useState, useEffect } from 'react'
import {
    ClockIcon,
    MapPinIcon,
    BuildingOfficeIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { database } from '../../firebase/config'
import { ref, onValue } from 'firebase/database'
import AttendanceModal from '../components/AttendanceModal'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'

export default function Home() {
    const { currentUser, userProfile } = useAuth()
    const [attendanceStats, setAttendanceStats] = useState({
        present: 0,
        late: 0,
        absent: 0
    })
    const [todayStatus, setTodayStatus] = useState(null) // null | { status: 'Present'|'Late', location: 'Office'|'Site', timestamp: '...' }
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [toast, setToast] = useState(null) // { message, type }

    // Fetch Attendance Data
    useEffect(() => {
        if (!currentUser) return

        const todayStr = new Date().toISOString().split('T')[0]
        const currentMonth = new Date().toISOString().slice(0, 7) // 2024-12
        const attendanceRef = ref(database, `users/${currentUser.uid}/attendance`)

        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                // Check for today's record
                const todayRecord = data[todayStr]
                if (todayRecord) {
                    setTodayStatus(todayRecord)
                }

                // Calculate Monthly Stats
                let stats = { present: 0, late: 0, absent: 0 }
                Object.entries(data).forEach(([date, record]) => {
                    if (date.startsWith(currentMonth)) {
                        // Strict check: Only count valid statuses
                        if (record.status === 'Present') stats.present++
                        else if (record.status === 'Late') stats.late++
                        else if (record.status === 'Absent' || record.status === 'half-day') stats.absent++
                    }
                })
                setAttendanceStats(stats)
            }
        })

        return () => unsubscribe()
    }, [currentUser])

    // Confetti Effect
    useEffect(() => {
        if (todayStatus?.status === 'Present') {
            const todayStr = new Date().toISOString().split('T')[0]
            const storageKey = `confetti_seen_${todayStr}`
            const hasSeen = localStorage.getItem(storageKey)

            if (!hasSeen) {
                import('canvas-confetti').then((confetti) => {
                    confetti.default({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#2563eb', '#3b82f6', '#60a5fa', '#fbbf24'] // Blue & Gold
                    })
                    localStorage.setItem(storageKey, 'true')
                })
            }
        }
    }, [todayStatus])

    const handleAttendanceSuccess = () => {
        setToast({ message: 'Attendance submitted for approval', type: 'success' })
        setIsModalOpen(false)
    }

    // Date Formatting
    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good Morning'
        if (hour < 18) return 'Good Afternoon'
        return 'Good Evening'
    }

    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Greeting Header */}
            <header className="bg-white dark:bg-slate-900 px-6 py-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {getGreeting()}, <span className="text-blue-600 dark:text-blue-500">{userProfile?.name?.split(' ')[0] || 'Team'}</span>
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{todayDate}</p>
            </header>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Hero Section: Conditional State */}
                <div className="w-full">
                    {!todayStatus ? (
                        // State 1: Not Marked
                        <div className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center h-full flex flex-col justify-center items-center">
                            <div className="inline-flex p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 mb-4 animate-bounce-subtle">
                                <ClockIcon className="w-10 h-10" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ready to Check In?</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">Tap below to record your attendance for {todayDate}.</p>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full max-w-sm bg-blue-600 dark:bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-95 transition-all text-base"
                            >
                                Mark Attendance
                            </button>
                        </div>
                    ) : (
                        // State 2: Already Marked
                        <div className={`bg-white dark:bg-slate-900 border rounded-2xl p-8 flex flex-col items-center text-center animate-scale-in h-full justify-center ${todayStatus.status === 'pending'
                            ? 'border-amber-200 dark:border-amber-900/50 from-amber-50 to-white'
                            : 'border-green-200 dark:border-green-900/50 from-green-50 to-white'
                            }`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${todayStatus.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30'
                                }`}>
                                {todayStatus.status === 'pending' ? (
                                    <ClockIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                                ) : (
                                    <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                {todayStatus.status === 'pending' ? 'Request Pending' : 'You\'re Checked In!'}
                            </h2>

                            <div className="flex items-center gap-2 mt-3 bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                                {todayStatus.locationType === 'Office' ? (
                                    <BuildingOfficeIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                ) : (
                                    <MapPinIcon className="w-4 h-4 text-amber-500" />
                                )}
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {todayStatus.locationType === 'Office' ? 'Office' : todayStatus.siteName || 'Site'}
                                </span>
                            </div>

                            <p className="text-xs font-mono text-slate-400 mt-4">
                                {new Date(todayStatus.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>

                            {/* Test Mode Button - Hidden in Prod */}
                            {currentUser?.email?.includes('chavan') && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-6 text-xs text-slate-300 hover:text-blue-500 underline decoration-dashed"
                                >
                                    Force Check-in Again
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Monthly Stats - Grid View */}
                <div className="w-full">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4 px-1">This Month</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {/* Stats Row */}
                        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <span className="text-2xl font-black text-green-600 dark:text-green-400 mb-1">{attendanceStats.present}</span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Present</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <span className="text-2xl font-black text-amber-500 dark:text-amber-400 mb-1">{attendanceStats.late}</span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Late</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <span className="text-2xl font-black text-red-500 dark:text-red-400 mb-1">{attendanceStats.absent}</span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Absent</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Modal */}
            <AttendanceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleAttendanceSuccess}
            />
        </div>
    )
}
