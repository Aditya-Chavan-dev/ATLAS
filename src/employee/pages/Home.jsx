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
        <div className="min-h-full bg-slate-50 font-sans">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Greeting Header */}
            <header className="bg-white px-6 py-6 border-b border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">
                    {getGreeting()}, {userProfile?.name?.split(' ')[0] || 'Team'}
                </h1>
                <p className="text-sm text-slate-500 mt-1">{todayDate}</p>
            </header>

            <div className="p-6 space-y-6">
                {/* Hero Section: Conditional State */}
                {!todayStatus ? (
                    // State 1: Not Marked
                    <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 rounded-lg p-8 shadow-sm text-center">
                        <div className="inline-flex p-3 bg-blue-100 rounded-full text-blue-600 mb-4">
                            <ClockIcon className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">Ready to Mark Attendance?</h2>
                        <p className="text-sm text-slate-600 mb-6">Tap below to record your presence for today.</p>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold shadow-md hover:bg-blue-700 active:scale-95 transition-all animate-pulse-subtle"
                        >
                            Mark Attendance
                        </button>
                    </div>
                ) : (
                    // State 2: Already Marked
                    <div className={`bg-gradient-to-br border-2 rounded-lg p-6 flex flex-col items-center text-center animate-scale-in ${todayStatus.status === 'pending'
                        ? 'from-amber-50 to-white border-amber-200'
                        : 'from-green-50 to-white border-green-500'
                        }`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${todayStatus.status === 'pending' ? 'bg-amber-100' : 'bg-green-100'
                            }`}>
                            {todayStatus.status === 'pending' ? (
                                <ClockIcon className="w-8 h-8 text-amber-600" />
                            ) : (
                                <CheckCircleIcon className="w-8 h-8 text-green-600" />
                            )}
                        </div>
                        <h2 className={`text-xl font-semibold mb-1 ${todayStatus.status === 'pending' ? 'text-amber-800' : 'text-green-800'
                            }`}>
                            {todayStatus.status === 'pending' ? 'Request Pending' : 'Attendance Marked'}
                        </h2>

                        <div className="flex items-center gap-2 mt-2 bg-white px-3 py-1 rounded-full border border-green-200 shadow-sm">
                            {todayStatus.locationType === 'Office' ? (
                                <BuildingOfficeIcon className="w-4 h-4 text-green-600" />
                            ) : (
                                <MapPinIcon className="w-4 h-4 text-amber-600" />
                            )}
                            <span className="text-sm font-medium text-slate-700">
                                {todayStatus.locationType === 'Office' ? 'Office' : `Site: ${todayStatus.siteName || 'Unknown'}`}
                            </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-4">
                            Marked at {new Date(todayStatus.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>

                        {/* Unlimited Marking for Tester */}
                        {currentUser?.email === 'adityagchavan.skn.comp@gmail.com' && (
                            <div className="mt-5 pt-4 border-t border-slate-100 w-full animate-fade-in">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full py-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                    <span>🧪</span> Mark Again (Test Mode)
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Monthly Stats */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">This Month</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <StatCard label="Present" value={attendanceStats.present} type="present" delay={0} />
                        <StatCard label="Late" value={attendanceStats.late} type="late" delay={50} />
                        <StatCard label="Absent" value={attendanceStats.absent} type="absent" delay={100} />
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
