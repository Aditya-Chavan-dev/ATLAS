// History Page - Clean Professional UI
import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSunday, getDay } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, BuildingOfficeIcon, MapPinIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { ref, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'

export default function EmployeeHistory() {
    const { currentUser } = useAuth()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [attendanceData, setAttendanceData] = useState({})
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(null)
    const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'

    // Real-time listener for attendance data
    useEffect(() => {
        if (!currentUser) return

        const attendanceRef = ref(database, `employees/${currentUser.uid}/attendance`)

        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            setLoading(true)
            if (snapshot.exists()) {
                const allData = snapshot.val()
                const monthData = {}
                const start = startOfMonth(currentDate)
                const end = endOfMonth(currentDate)

                Object.entries(allData).forEach(([dateStr, record]) => {
                    const recordDate = new Date(dateStr)
                    if (recordDate >= start && recordDate <= end) {
                        monthData[dateStr] = { ...record, date: dateStr }
                    }
                })

                setAttendanceData(monthData)
            } else {
                setAttendanceData({})
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser, currentDate])

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    })

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
        setSelectedDate(null)
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
        setSelectedDate(null)
    }

    // Stats
    const totalDays = Object.values(attendanceData).filter(d => d.status === 'approved').length
    const leaveCount = Object.values(attendanceData).filter(d => d.location === 'leave').length
    const pendingCount = Object.values(attendanceData).filter(d => d.status === 'pending').length

    const getDayStatus = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        const record = attendanceData[dateStr]
        if (!record) return null
        return record
    }

    const getDayColor = (date) => {
        const record = getDayStatus(date)
        if (!record) return ''
        if (record.status === 'approved') {
            return record.location === 'office' ? 'var(--emp-accent)' : 'var(--emp-success)'
        }
        if (record.status === 'pending') return 'var(--emp-warning)'
        if (record.status === 'rejected') return 'var(--emp-danger)'
        return ''
    }

    const getStatusBadge = (record) => {
        if (record.status === 'approved') {
            return (
                <span className="emp-badge success">
                    <span className="emp-status-dot success"></span>
                    Present
                </span>
            )
        }
        if (record.status === 'pending') {
            return (
                <span className="emp-badge warning">
                    <span className="emp-status-dot warning"></span>
                    Pending
                </span>
            )
        }
        return (
            <span className="emp-badge danger">
                <span className="emp-status-dot danger"></span>
                Rejected
            </span>
        )
    }

    // Get first day offset for calendar grid
    const firstDayOfMonth = getDay(startOfMonth(currentDate))
    const emptyDays = Array(firstDayOfMonth).fill(null)

    return (
        <div className="space-y-6 emp-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--emp-text-primary)' }}>
                        History
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--emp-text-muted)' }}>
                        Your attendance records
                    </p>
                </div>

                {/* View Toggle */}
                <div className="flex p-1 rounded-lg" style={{ background: 'var(--emp-bg-secondary)' }}>
                    <button
                        onClick={() => setViewMode('list')}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                        style={{
                            background: viewMode === 'list' ? 'var(--emp-accent)' : 'transparent',
                            color: viewMode === 'list' ? '#ffffff' : 'var(--emp-text-muted)'
                        }}
                    >
                        List
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                        style={{
                            background: viewMode === 'calendar' ? 'var(--emp-accent)' : 'transparent',
                            color: viewMode === 'calendar' ? '#ffffff' : 'var(--emp-text-muted)'
                        }}
                    >
                        Calendar
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="emp-stat-card">
                    <p className="emp-stat-value" style={{ color: 'var(--emp-accent)' }}>{totalDays}</p>
                    <p className="emp-stat-label">Total Days</p>
                </div>
                <div className="emp-stat-card">
                    <p className="emp-stat-value" style={{ color: 'var(--emp-warning)' }}>{leaveCount}</p>
                    <p className="emp-stat-label">Leaves</p>
                </div>
                <div className="emp-stat-card">
                    <p className="emp-stat-value" style={{ color: 'var(--emp-text-muted)' }}>{pendingCount}</p>
                    <p className="emp-stat-label">Pending</p>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={previousMonth}
                    className="p-2 rounded-lg transition-all"
                    style={{ background: 'var(--emp-bg-card)', color: 'var(--emp-text-primary)' }}
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h3 className="text-base font-semibold" style={{ color: 'var(--emp-text-primary)' }}>
                    {format(currentDate, 'MMMM yyyy')}
                </h3>
                <button
                    onClick={nextMonth}
                    className="p-2 rounded-lg transition-all"
                    style={{ background: 'var(--emp-bg-card)', color: 'var(--emp-text-primary)' }}
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div
                        className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
                        style={{ borderColor: 'var(--emp-accent)', borderTopColor: 'transparent' }}
                    />
                </div>
            ) : viewMode === 'calendar' ? (
                /* Calendar View */
                <div className="emp-calendar">
                    {/* Day Labels */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div
                                key={i}
                                className="text-center text-xs font-medium py-2"
                                style={{ color: 'var(--emp-text-muted)' }}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells for alignment */}
                        {emptyDays.map((_, i) => (
                            <div key={`empty-${i}`} className="emp-calendar-day opacity-0">-</div>
                        ))}

                        {/* Actual days */}
                        {daysInMonth.map((date) => {
                            const dayColor = getDayColor(date)
                            const record = getDayStatus(date)
                            const isSelected = selectedDate && isSameDay(date, selectedDate)

                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => setSelectedDate(date)}
                                    className={`emp-calendar-day ${isSelected ? 'ring-2' : ''}`}
                                    style={{
                                        background: dayColor || 'transparent',
                                        color: dayColor ? '#ffffff' : 'var(--emp-text-primary)',
                                        ringColor: 'var(--emp-accent)',
                                        opacity: isSunday(date) && !record ? 0.4 : 1
                                    }}
                                >
                                    {format(date, 'd')}
                                </button>
                            )
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-4 pt-4 mt-4" style={{ borderTop: '1px solid var(--emp-border)' }}>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--emp-accent)' }} />
                            <span className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>Office</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--emp-success)' }} />
                            <span className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>Site</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--emp-warning)' }} />
                            <span className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>Pending</span>
                        </div>
                    </div>
                </div>
            ) : (
                /* List View */
                <div className="emp-card p-0 overflow-hidden">
                    {/* Table Header */}
                    <div className="emp-table-header">
                        <span>Date</span>
                        <span>Out</span>
                        <span>Status</span>
                    </div>

                    {Object.keys(attendanceData).length === 0 ? (
                        <div className="p-8 text-center">
                            <p style={{ color: 'var(--emp-text-muted)' }}>No records this month</p>
                        </div>
                    ) : (
                        Object.keys(attendanceData)
                            .sort((a, b) => new Date(b) - new Date(a))
                            .map(dateStr => {
                                const record = attendanceData[dateStr]
                                const dateObj = new Date(dateStr)
                                const timeStr = record.timestamp ? format(new Date(record.timestamp), 'h:mm a') : '--'

                                return (
                                    <div key={dateStr} className="emp-table-row">
                                        <div>
                                            <p className="font-medium text-sm" style={{ color: 'var(--emp-text-primary)' }}>
                                                {format(dateObj, 'MMM d')}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>
                                                {format(dateObj, 'EEE')}
                                            </p>
                                        </div>
                                        <span style={{ color: 'var(--emp-text-muted)' }}>
                                            {timeStr}
                                        </span>
                                        <div>
                                            {getStatusBadge(record)}
                                        </div>
                                    </div>
                                )
                            })
                    )}
                </div>
            )}

            {/* Selected Date Details (Calendar Mode) */}
            {viewMode === 'calendar' && selectedDate && attendanceData[format(selectedDate, 'yyyy-MM-dd')] && (
                <div className="emp-card">
                    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--emp-text-primary)' }}>
                        {format(selectedDate, 'EEEE, do MMMM')}
                    </h3>
                    {(() => {
                        const record = attendanceData[format(selectedDate, 'yyyy-MM-dd')]
                        return (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                        style={{
                                            background: record.location === 'office' ? 'var(--emp-accent-glow)' : 'rgba(34, 197, 94, 0.15)',
                                            color: record.location === 'office' ? 'var(--emp-accent)' : 'var(--emp-success)'
                                        }}
                                    >
                                        {record.location === 'office' ? (
                                            <BuildingOfficeIcon className="w-5 h-5" />
                                        ) : (
                                            <MapPinIcon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm" style={{ color: 'var(--emp-text-primary)' }}>
                                            {record.location === 'office' ? 'Office' : record.siteName || 'Site'}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>
                                            {record.timestamp ? format(new Date(record.timestamp), 'h:mm a') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                {getStatusBadge(record)}
                            </div>
                        )
                    })()}
                </div>
            )}
        </div>
    )
}
