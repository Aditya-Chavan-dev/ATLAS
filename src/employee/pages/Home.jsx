// Home Page - Exact UI Replica (Brown Theme)
import { useState, useEffect } from 'react'
import { format, isSunday } from 'date-fns'
import {
    MapPinIcon,
    BellIcon,
    ClockIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline'
import { ref, onValue, set, update } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import AttendanceModal from '../components/AttendanceModal'
import RefinedModal from '../../components/ui/RefinedModal'
import './Home.css'

export default function EmployeeHome() {
    const { currentUser } = useAuth()
    const [todayAttendance, setTodayAttendance] = useState(null)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [stats, setStats] = useState({ present: 0, late: 0, absent: 0 })

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)

    // Correction Logic
    const [isCorrectionMode, setIsCorrectionMode] = useState(false)
    const [correctionCount, setCorrectionCount] = useState(0)
    const MAX_CORRECTIONS_PER_DAY = 3
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' })

    const showMessageModal = (title, message, type = 'info') => {
        setModalConfig({ isOpen: true, title, message, type })
    }

    // Live Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Fetch Data
    useEffect(() => {
        if (!currentUser) return

        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const currentMonth = format(new Date(), 'yyyy-MM')

        const attendanceRef = ref(database, `employees/${currentUser.uid}/attendance`)
        const leavesRef = ref(database, `leaves/${currentUser.uid}`)

        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            let presentCount = 0

            if (snapshot.exists()) {
                const allData = snapshot.val()

                if (allData[todayStr]) {
                    setTodayAttendance({ date: todayStr, ...allData[todayStr] })
                    setCorrectionCount(allData[todayStr].correctionCount || 0)
                } else {
                    setTodayAttendance(null)
                    setCorrectionCount(0)
                }

                Object.values(allData).forEach(record => {
                    const recordMonth = record.submittedAt ? record.submittedAt.slice(0, 7) : ''
                    if (recordMonth === currentMonth && record.status === 'approved') {
                        presentCount++
                    }
                })
            } else {
                setTodayAttendance(null)
            }

            setStats(prev => ({ ...prev, present: presentCount }))
            setLoading(false)
        })

        const unsubLeaves = onValue(leavesRef, (snapshot) => {
            let leaveCount = 0
            if (snapshot.exists()) {
                const leaves = snapshot.val()
                Object.values(leaves).forEach(leave => {
                    if (leave.status === 'approved') {
                        leaveCount++
                    }
                })
            }
            setStats(prev => ({ ...prev, absent: leaveCount }))
        })

        return () => {
            unsubscribe()
            unsubLeaves()
        }
    }, [currentUser])

    const handleMarkAttendance = async (status, siteName = '') => {
        if (!currentUser) return
        setIsSubmitting(true)
        try {
            const now = new Date()
            const todayStr = format(now, 'yyyy-MM-dd')
            const attendanceData = {
                status: 'pending',
                location: status.toLowerCase(),
                siteName: siteName || null,
                timestamp: now.getTime(),
                submittedAt: now.toISOString(),
                employeeId: currentUser.uid,
                employeeEmail: currentUser.email,
                employeeName: currentUser.displayName || 'Unknown'
            }
            await set(ref(database, `employees/${currentUser.uid}/attendance/${todayStr}`), attendanceData)
            setTodayAttendance({ date: todayStr, ...attendanceData })
            setIsModalOpen(false)
            showMessageModal('Success', 'Attendance marked!', 'success')
        } catch (error) {
            showMessageModal('Error', 'Failed to mark.', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCorrectionRequest = async (newStatus, newSiteName) => {
        if (!currentUser || !todayAttendance) return
        if (correctionCount >= MAX_CORRECTIONS_PER_DAY) {
            showMessageModal('Limit', 'Max corrections reached.', 'warning')
            return
        }
        setIsSubmitting(true)
        try {
            const now = new Date()
            const correctionData = {
                status: 'pending',
                location: newStatus.toLowerCase(),
                siteName: newSiteName || '',
                correctionRequestedAt: now.toISOString(),
                correctionCount: correctionCount + 1,
                isCorrection: true
            }
            await update(ref(database, `employees/${currentUser.uid}/attendance/${todayAttendance.date}`), correctionData)
            setTodayAttendance({ ...todayAttendance, ...correctionData })
            setCorrectionCount(prev => prev + 1)
            setIsModalOpen(false)
            setIsCorrectionMode(false)
            showMessageModal('Sent', 'Correction requested.', 'success')
        } catch (e) {
            showMessageModal('Error', 'Failed.', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) return <div className="flex justify-center items-center h-screen bg-[#FDFBF7]">Loading...</div>

    return (
        <div className="home-container">
            {/* Header */}
            <div className="home-header">
                <div className="header-top">
                    <div className="user-profile">
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="User" className="user-avatar" />
                        ) : (
                            <div className="user-avatar flex items-center justify-center text-white font-bold text-lg">
                                {currentUser?.displayName?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div className="user-info">
                            <h2>{currentUser?.displayName || 'User'}</h2>
                            <p>Employee</p>
                        </div>
                    </div>
                    <div className="notification-btn">
                        <div className="notif-dot"></div>
                        <BellIcon className="w-5 h-5 text-white" />
                    </div>
                </div>

                <div className="header-row-2">
                    <h1 className="page-title">Todays Attendance</h1>
                    <span className="current-date">{format(currentTime, 'd MMM, yyyy')}</span>
                </div>
            </div>

            {/* Clock Card */}
            <div className="clock-card">
                <div className="work-label">Working Time</div>
                <div className="time-display">
                    <div className="time-box">
                        <span className="time-val">{format(currentTime, 'hh')}</span>
                    </div>
                    <span className="time-colon">:</span>
                    <div className="time-box">
                        <span className="time-val">{format(currentTime, 'mm')}</span>
                    </div>
                    <div className="ampm-box">
                        {format(currentTime, 'a')}
                    </div>
                </div>

                <div className="location-row">
                    <MapPinIcon className="w-4 h-4" />
                    {todayAttendance
                        ? (todayAttendance.location === 'office' ? 'Office Location' : (todayAttendance.siteName || 'Remote Site'))
                        : 'Location Pending'}
                </div>

                <button
                    className={`main-action-btn ${todayAttendance && todayAttendance.status !== 'pending' ? 'disabled' : ''}`}
                    onClick={() => {
                        if (!todayAttendance) setIsModalOpen(true)
                        else if (todayAttendance.status !== 'pending' && correctionCount < MAX_CORRECTIONS_PER_DAY) {
                            setIsCorrectionMode(true)
                            setIsModalOpen(true)
                        }
                    }}
                    disabled={isSunday(currentTime) && !todayAttendance}
                >
                    <ClockIcon className="w-5 h-5" />
                    {todayAttendance
                        ? (todayAttendance.status === 'pending' ? 'Marked' : 'Correction')
                        : 'Checkout'}
                </button>
            </div>

            {/* Stats */}
            <div className="stats-wrapper">
                <div className="stats-header">
                    <span className="stats-title">Total Attendance (Days)</span>
                    <button className="stats-filter">
                        {format(new Date(), 'MMM')} <ChevronDownIcon className="w-3 h-3" />
                    </button>
                </div>

                <div className="stats-card">
                    <div className="stat-item present">
                        <span className="stat-num">{stats.present}</span>
                        <span className="stat-label">Present</span>
                    </div>
                    <div className="stat-item late">
                        <span className="stat-num">{stats.late}</span>
                        <span className="stat-label">Late</span>
                    </div>
                    <div className="stat-item absent">
                        <span className="stat-num">{stats.absent}</span>
                        <span className="stat-label">Absent</span>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AttendanceModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setIsCorrectionMode(false)
                }}
                onConfirm={isCorrectionMode ? handleCorrectionRequest : handleMarkAttendance}
                isSubmitting={isSubmitting}
                isCorrection={isCorrectionMode}
                currentAttendance={isCorrectionMode ? todayAttendance : null}
            />

            <RefinedModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />
        </div>
    )
}
