import { useState, useEffect, useRef } from 'react'
import { ref, onValue, set, push } from 'firebase/database'
import { database } from '../../firebase/config'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

import { SECOND_MD_CONFIG } from '../../utils/constants'

function MDDashboard() {
    const navigate = useNavigate()
    const [viewMode, setViewMode] = useState('cards') // 'cards' or 'grid'
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        onLeave: 0,
        onSite: 0
    })
    const [employees, setEmployees] = useState([])
    const [attendanceData, setAttendanceData] = useState([])
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
    const [sendingNotification, setSendingNotification] = useState(false)
    const [notificationResult, setNotificationResult] = useState(null)

    const API_URL = import.meta.env.VITE_API_URL || 'https://atlas-backend-gncd.onrender.com'


    useEffect(() => {
        const usersRef = ref(database, 'users')
        const attendanceRef = ref(database, 'attendance')
        const leavesRef = ref(database, 'leaves')

        // Internal stores to avoid stale closures in effects
        let rawUsers = {}
        let rawAttendance = {}
        let rawLeaves = {}

        const updateState = () => {
            // Basic User List
            const userList = Object.entries(rawUsers)
                .map(([uid, user]) => ({ uid, ...user, lastSeen: 'Never' }))
                .filter(u => u.role !== 'md' && u.role !== 'admin')

            const attRecords = Object.values(rawAttendance)
            const leaveRecords = []
            Object.values(rawLeaves).forEach(userLeaves => {
                Object.values(userLeaves).forEach(l => leaveRecords.push(l))
            })

            // Today Info
            const today = new Date().toISOString().split('T')[0]
            const todayAttendance = attRecords.filter(r => r.date === today)

            // Check Leaves for Today
            const todayLeaves = leaveRecords.filter(l => {
                if (l.status !== 'approved') return false
                const start = new Date(l.from)
                const end = new Date(l.to)
                start.setHours(0, 0, 0, 0)
                end.setHours(0, 0, 0, 0)
                const t = new Date(today)
                t.setHours(0, 0, 0, 0)
                return t >= start && t <= end
            })

            // Map Last Seen
            const userMap = new Map()
            userList.forEach(u => userMap.set(u.uid, u))

            attRecords.forEach(r => {
                const u = userMap.get(r.employeeId) // Assuming employeeId is uid.
                if (u) {
                    if (!u.lastSeen || u.lastSeen === 'Never' || r.date > u.lastSeen) {
                        u.lastSeen = r.date
                    }
                } else {
                    // Fallback if employeeId was email in old records
                    const uByEmail = userList.find(user => user.email === r.employeeEmail)
                    if (uByEmail && (!uByEmail.lastSeen || uByEmail.lastSeen === 'Never' || r.date > uByEmail.lastSeen)) {
                        uByEmail.lastSeen = r.date
                    }
                }
            })

            setAttendanceData(attRecords)
            setEmployees(userList)

            // Stats
            // Use Set to ensure unique employees are counted (fixes increment bug if duplicates exist)
            const presentTodayEmails = new Set(
                todayAttendance
                    .filter(r => r.status === 'approved')
                    .map(r => r.employeeEmail || r.employeeId)
            )

            setStats({
                totalEmployees: userList.length,
                presentToday: presentTodayEmails.size,
                onLeave: todayLeaves.length,
                onSite: todayAttendance.filter(r => r.status === 'approved' && r.location === 'site').length
            })

            // Handle 2nd MD (using all records)
            // Debounce or check narrowly to avoid loops
            handleSecondMDAttendance(attRecords, today)

            setLoading(false)
        }

        const unsubUsers = onValue(usersRef, (snap) => {
            rawUsers = snap.val() || {}
            updateState()
        })
        const unsubAtt = onValue(attendanceRef, (snap) => {
            rawAttendance = snap.val() || {}
            updateState()
        })
        const unsubLeaves = onValue(leavesRef, (snap) => {
            rawLeaves = snap.val() || {}
            updateState()
        })

        return () => {
            unsubUsers()
            unsubAtt()
            unsubLeaves()
        }
    }, [])

    // Ref to track auto-marking attempts to avoid infinite loops/race conditions
    const autoMarkedDates = useRef(new Set())

    const handleSecondMDAttendance = async (records, todayStr) => {
        // Check last 7 days to backfill if missed
        const daysToCheck = 7
        const today = new Date()

        for (let i = 0; i < daysToCheck; i++) {
            const d = new Date()
            d.setDate(today.getDate() - i)

            // Skip Sundays
            if (d.getDay() === 0) continue

            const dateStr = d.toISOString().split('T')[0]

            // If we already attempted to mark this date this session, skip
            if (autoMarkedDates.current.has(dateStr)) continue

            // Check if 2nd MD has attendance for this date
            const hasAttendance = records.some(r =>
                (r.employeeEmail === SECOND_MD_CONFIG.email) &&
                r.date === dateStr
            )

            if (!hasAttendance) {
                // Optimistically mark as handled so we don't retry immediately
                autoMarkedDates.current.add(dateStr)

                console.log(`Auto-marking attendance for 2nd MD on ${dateStr}...`)
                try {
                    const newRef = push(ref(database, 'attendance'))
                    await set(newRef, {
                        employeeEmail: SECOND_MD_CONFIG.email,
                        employeeName: SECOND_MD_CONFIG.name,
                        date: dateStr,
                        timestamp: d.getTime(),
                        location: 'office',
                        status: 'approved',
                        siteName: '',
                        autoGenerated: true
                    })
                } catch (error) {
                    console.error(`Failed to auto-mark 2nd MD attendance for ${dateStr}:`, error)
                    // If failed, allow retry later? Maybe safest to leave blocked for this session
                    // autoMarkedDates.current.delete(dateStr) 
                }
            } else {
                // If found, no need to check again this session
                autoMarkedDates.current.add(dateStr)
            }
        }
    }

    const handleSendReminder = async () => {
        setSendingNotification(true)
        setNotificationResult(null)

        try {
            const response = await fetch(`${API_URL}/api/trigger-reminder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            const data = await response.json()

            if (response.ok) {
                setNotificationResult({
                    success: true,
                    message: data.employeeCount === 0
                        ? 'No employees found with notification tokens'
                        : `Reminder sent to ${data.employeeCount} employee(s)`,
                    count: data.employeeCount
                })
            } else {
                setNotificationResult({
                    success: false,
                    message: data.error || 'Failed to send reminder'
                })
            }
        } catch (error) {
            console.error('Error sending reminder:', error)
            setNotificationResult({
                success: false,
                message: 'Network error. Please check if backend is running.'
            })
        } finally {
            setSendingNotification(false)
            // Clear message after 5 seconds
            setTimeout(() => setNotificationResult(null), 5000)
        }
    }


    const getDaysInMonth = (monthStr) => {
        const [year, month] = monthStr.split('-')
        const date = new Date(year, month, 0)
        const days = date.getDate()
        const daysArray = []
        for (let i = 1; i <= days; i++) {
            daysArray.push(new Date(year, month - 1, i))
        }
        return daysArray
    }

    const days = getDaysInMonth(selectedMonth)

    const getAttendanceStatus = (empEmail, date) => {
        const dateStr = date.toISOString().split('T')[0]
        const record = attendanceData.find(r => r.employeeEmail === empEmail && r.date === dateStr)

        if (!record) return null
        return record
    }

    return (
        <div className="md-page-container">
            <div className="md-content-wrapper">
                <header className="page-header">
                    <div>
                        <h1>Dashboard</h1>
                        <p>Overview of attendance and employee status</p>
                    </div>
                    <div className="header-controls">
                        <button
                            className="send-reminder-btn"
                            onClick={handleSendReminder}
                            disabled={sendingNotification}
                        >
                            {sendingNotification ? (
                                <>
                                    <span className="spinner"></span>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                    </svg>
                                    Send Reminder
                                </>
                            )}
                        </button>
                        <div className="view-toggle">
                            <button
                                className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                                onClick={() => setViewMode('cards')}
                            >
                                Cards
                            </button>
                            <button
                                className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                Grid
                            </button>
                        </div>
                        {viewMode === 'grid' && (
                            <input
                                type="month"
                                value={selectedMonth}

                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="month-selector"
                            />
                        )}
                    </div>
                </header>

                {/* Notification Result Message */}
                {notificationResult && (
                    <div className={`notification-result ${notificationResult.success ? 'success' : 'error'}`}>
                        <span className="result-icon">
                            {notificationResult.success ? '✅' : '❌'}
                        </span>
                        <span className="result-message">{notificationResult.message}</span>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon total">👥</div>
                        <div className="stat-info">
                            <h3>Total Employees</h3>
                            <p>{stats.totalEmployees}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon present">✅</div>
                        <div className="stat-info">
                            <h3>Present Today</h3>
                            <p>{stats.presentToday}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon site">🏗️</div>
                        <div className="stat-info">
                            <h3>On Site</h3>
                            <p>{stats.onSite}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon leave">🏖️</div>
                        <div className="stat-info">
                            <h3>On Leave</h3>
                            <p>{stats.onLeave}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="loading-state">Loading data...</div>
                ) : viewMode === 'cards' ? (
                    <div className="employee-cards-grid">
                        {employees.map(emp => (
                            <div key={emp.email} className="emp-summary-card">
                                <div className="emp-card-header">
                                    <div className="emp-avatar">
                                        {(emp.name || emp.email || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="emp-details">
                                        <h4>{emp.name || emp.email || 'Unknown'}</h4>
                                        <span className="last-seen">Last seen: {emp.lastSeen}</span>
                                    </div>
                                </div>
                                <button
                                    className="view-profile-btn"
                                    onClick={() => navigate(`/md/profiles/${emp.uid}`)}
                                >
                                    View Profile
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="calendar-grid-container">
                        <table className="calendar-table">
                            <thead>
                                <tr>
                                    <th className="sticky-col">Employee</th>
                                    {days.map(day => (
                                        <th key={day.toISOString()} className={day.getDay() === 0 ? 'sunday-header' : ''}>
                                            {day.getDate()}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp.email}>
                                        <td className="sticky-col name-col">{emp.name}</td>
                                        {days.map(day => {
                                            const status = getAttendanceStatus(emp.email, day)
                                            const isSunday = day.getDay() === 0
                                            let cellClass = isSunday ? 'sunday-cell' : 'empty-cell'
                                            let content = ''

                                            if (status) {
                                                if (status.status === 'approved') {
                                                    cellClass = status.location === 'office' ? 'present-office' : 'present-site'
                                                    content = status.location === 'office' ? 'O' : 'S'
                                                } else if (status.status === 'pending') {
                                                    cellClass = 'pending-cell'
                                                    content = 'P'
                                                }
                                            }

                                            return (
                                                <td key={day.toISOString()} className={`grid-cell ${cellClass}`}>
                                                    {content}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MDDashboard
