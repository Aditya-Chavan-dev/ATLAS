import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'

export default function EmployeeHistory() {
    const { currentUser } = useAuth()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [attendanceData, setAttendanceData] = useState({})
    const [loading, setLoading] = useState(true)

    // Real-time listener for attendance data - NEW: from /employees/{uid}/attendance
    useEffect(() => {
        if (!currentUser) return

        // NEW PATH: /employees/{uid}/attendance (all attendance for this user)
        const attendanceRef = ref(database, `employees/${currentUser.uid}/attendance`)

        // Real-time listener - updates automatically when data changes
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            setLoading(true)
            if (snapshot.exists()) {
                const allData = snapshot.val() // { "2025-12-01": {...}, "2025-12-02": {...}, ... }
                const monthData = {}

                // Get first and last day of selected month
                const start = startOfMonth(currentDate)
                const end = endOfMonth(currentDate)

                // Filter attendance records for selected month
                // In new structure, keys are dates like "2025-12-13"
                Object.entries(allData).forEach(([dateStr, record]) => {
                    const recordDate = new Date(dateStr)
                    if (recordDate >= start && recordDate <= end) {
                        monthData[dateStr] = {
                            ...record,
                            date: dateStr // Ensure date is included
                        }
                    }
                })

                setAttendanceData(monthData)
            } else {
                setAttendanceData({})
            }
            setLoading(false)
        })

        // Cleanup subscription on unmount
        return () => unsubscribe()
    }, [currentUser, currentDate])

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    })

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    // Calculate stats based on status (approved attendance only)
    const officeCount = Object.values(attendanceData).filter(d =>
        d.status === 'approved' && d.location === 'office'
    ).length
    const siteCount = Object.values(attendanceData).filter(d =>
        d.status === 'approved' && d.location === 'site'
    ).length
    const pendingCount = Object.values(attendanceData).filter(d =>
        d.status === 'pending'
    ).length

    const getStatusInfo = (record) => {
        if (!record) return null

        if (record.status === 'approved') {
            return {
                type: record.location === 'office' ? 'Office' : 'Site',
                color: record.location === 'office' ? 'indigo' : 'orange'
            }
        } else if (record.status === 'pending') {
            return {
                type: 'Pending',
                color: 'amber'
            }
        } else if (record.status === 'rejected') {
            return {
                type: 'Rejected',
                color: 'red'
            }
        }
        return null
    }

    // Simplified History View
    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">My Attendance History</h2>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : Object.keys(attendanceData).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-500">No attendance history found for this month.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Sort dates descending */}
                    {Object.keys(attendanceData)
                        .sort((a, b) => new Date(b) - new Date(a))
                        .map(dateStr => {
                            const record = attendanceData[dateStr]
                            const statusInfo = getStatusInfo(record)
                            if (!statusInfo) return null

                            const dateObj = new Date(dateStr)

                            // Format: "20th Dec 2025"
                            const formattedDate = format(dateObj, 'do MMM yyyy')

                            // Format Time: "7.00 AM" (using timestamp if available)
                            const timeStr = record.timestamp
                                ? format(new Date(record.timestamp), 'h.mm a')
                                : 'N/A'

                            return (
                                <div
                                    key={dateStr}
                                    className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                                            ${statusInfo?.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                                                statusInfo?.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                                                    statusInfo?.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                                                        statusInfo?.color === 'red' ? 'bg-red-100 text-red-600' :
                                                            'bg-slate-100 text-slate-400'}
                                        `}>
                                            {format(dateObj, 'd')}
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-slate-800">{formattedDate}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`
                                                    text-xs px-2 py-0.5 rounded-full font-medium
                                                    ${statusInfo.color === 'indigo' ? 'bg-indigo-50 text-indigo-700' :
                                                        statusInfo.color === 'orange' ? 'bg-orange-50 text-orange-700' :
                                                            statusInfo.color === 'amber' ? 'bg-amber-50 text-amber-700' :
                                                                'bg-red-50 text-red-700'}
                                                `}>
                                                    {statusInfo.type}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    • {timeStr}
                                                </span>
                                            </div>
                                            {record?.siteName && (
                                                <p className="text-xs text-slate-500 mt-1">Site: {record.siteName}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Indicator Icon */}
                                    <div className="hidden sm:block">
                                        {record.status === 'approved' && (
                                            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                        {record.status === 'pending' && (
                                            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                        {record.status === 'rejected' && (
                                            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                </div>
            )}
        </div>
    )
}
