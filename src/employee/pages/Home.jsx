import { useState, useEffect } from 'react'
import { format, isSunday } from 'date-fns'
import { MapPinIcon, BuildingOfficeIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { ref, onValue, set, update } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import AttendanceModal from '../components/AttendanceModal'
import RefinedModal from '../../components/ui/RefinedModal'

export default function EmployeeHome() {
    const { currentUser } = useAuth()
    const [todayAttendance, setTodayAttendance] = useState(null)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)
    const [isCorrectionMode, setIsCorrectionMode] = useState(false)
    const [correctionCount, setCorrectionCount] = useState(0)
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' })
    const MAX_CORRECTIONS_PER_DAY = 3

    const showMessageModal = (title, message, type = 'info') => {
        setModalConfig({ isOpen: true, title, message, type })
    }

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Real-time listener for today's attendance - now from /employees/{uid}/attendance/{date}
    useEffect(() => {
        if (!currentUser) return

        const todayStr = format(new Date(), 'yyyy-MM-dd')
        // New path: /employees/{uid}/attendance/{date}
        const attendanceRef = ref(database, `employees/${currentUser.uid}/attendance/${todayStr}`)

        // Real-time listener - no refresh needed!
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val()
                setTodayAttendance({ date: todayStr, ...data })
                // Track correction count for the day
                setCorrectionCount(data.correctionCount || 0)
            } else {
                setTodayAttendance(null)
                setCorrectionCount(0)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser])

    const handleMarkAttendance = async (status, siteName = '') => {
        if (!currentUser) return
        setIsSubmitting(true)

        try {
            const now = new Date()
            const todayStr = format(now, 'yyyy-MM-dd')

            const attendanceData = {
                status: 'pending', // All new attendance goes for approval
                location: status.toLowerCase(), // 'office' or 'site'
                siteName: siteName || null,
                timestamp: now.getTime(),
                submittedAt: now.toISOString(),
                employeeId: currentUser.uid,
                employeeEmail: currentUser.email,
                employeeName: currentUser.displayName || 'Unknown'
            }

            // NEW: Write to employee-specific path: /employees/{uid}/attendance/{date}
            const attendanceRef = ref(database, `employees/${currentUser.uid}/attendance/${todayStr}`)
            await set(attendanceRef, attendanceData)

            setTodayAttendance({ date: todayStr, ...attendanceData })
            setIsModalOpen(false)
            showMessageModal('Success', 'Attendance marked successfully!', 'success')
        } catch (error) {
            console.error("Error marking attendance:", error)
            showMessageModal('Error', 'Failed to mark attendance. Please try again.', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCorrectionRequest = async (newStatus, newSiteName = '') => {
        if (!currentUser || !todayAttendance) return

        // Ensure we have a valid attendance date
        if (!todayAttendance.date) {
            showMessageModal('Error', 'Unable to submit correction. Please refresh the page and try again.', 'error')
            return
        }

        // Check if max corrections reached
        if (correctionCount >= MAX_CORRECTIONS_PER_DAY) {
            showMessageModal('Limit Reached', `You have reached the maximum limit of ${MAX_CORRECTIONS_PER_DAY} correction requests per day.`, 'warning')
            return
        }

        // Check if correction is same as current
        const newLocation = newStatus.toLowerCase()
        const currentLocation = (todayAttendance.location || '').toLowerCase()
        const currentSiteName = (todayAttendance.siteName || '').trim().toLowerCase()
        const newSite = (newSiteName || '').trim().toLowerCase()

        // Both location and site name must match to be considered "same"
        const isSameLocation = currentLocation === newLocation
        const isSameSite = currentSiteName === newSite

        if (isSameLocation && isSameSite) {
            showMessageModal('No Change Detected', 'Correction request must be different from current attendance.', 'warning')
            return
        }

        setIsSubmitting(true)

        try {
            const now = new Date()
            const newCorrectionCount = correctionCount + 1

            const correctionData = {
                status: 'pending', // Set to pending for MD approval
                previousLocation: todayAttendance.location || '',
                previousSiteName: todayAttendance.siteName || '',
                location: newLocation,
                siteName: newSiteName || '',
                correctionRequestedAt: now.toISOString(),
                correctionTimestamp: now.getTime(),
                correctionCount: newCorrectionCount,
                isCorrection: true
            }

            console.log('Submitting correction:', { date: todayAttendance.date, correctionData })

            // Update existing attendance record with correction request - NEW PATH
            await update(ref(database, `employees/${currentUser.uid}/attendance/${todayAttendance.date}`), correctionData)

            setTodayAttendance({ ...todayAttendance, ...correctionData })
            setCorrectionCount(newCorrectionCount)
            setIsModalOpen(false)
            setIsCorrectionMode(false)
        } catch (error) {
            console.error("Error submitting correction:", error)
            showMessageModal('Error', 'Failed to submit correction request. Please try again.', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const openCorrectionModal = () => {
        // Check if max corrections reached before opening modal
        if (correctionCount >= MAX_CORRECTIONS_PER_DAY) {
            showMessageModal('Limit Reached', `You have reached the maximum limit of ${MAX_CORRECTIONS_PER_DAY} correction requests per day.`, 'warning')
            return
        }
        setIsCorrectionMode(true)
        setIsModalOpen(true)
    }

    const getStatusDisplay = () => {
        if (!todayAttendance) return null

        switch (todayAttendance.status) {
            case 'pending':
                // Show different text if this is a correction request
                if (todayAttendance.isCorrection) {
                    return { text: 'Correction Pending Approval', color: 'orange', icon: '📝' }
                }
                return { text: 'Pending Approval', color: 'yellow', icon: '⏳' }
            case 'approved':
                return { text: 'Approved', color: 'green', icon: '✅' }
            case 'rejected':
                return { text: 'Rejected', color: 'red', icon: '❌' }
            default:
                return { text: todayAttendance.status, color: 'gray', icon: '•' }
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    const statusDisplay = getStatusDisplay()

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Greeting & Time */}
            <div className="space-y-1">
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-800">
                    Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'},
                </h2>
                <p className="text-slate-500 text-sm lg:text-base font-medium">
                    {format(currentTime, 'EEEE, d MMMM yyyy')}
                </p>
            </div>

            {/* Desktop: Two Column Layout */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
                {/* Mark Attendance Card */}
                <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 lg:w-48 lg:h-48 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>

                    <div className="relative z-10">
                        <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-1">Mark Attendance</h3>
                        <p className="text-slate-500 text-sm mb-6">Record your presence for today</p>

                        {todayAttendance && (
                            <div className={`bg-${statusDisplay?.color === 'green' ? 'green' : statusDisplay?.color === 'yellow' ? 'amber' : statusDisplay?.color === 'orange' ? 'orange' : statusDisplay?.color === 'red' ? 'red' : 'slate'}-50 border border-${statusDisplay?.color === 'green' ? 'green' : statusDisplay?.color === 'yellow' ? 'amber' : 'slate'}-100 rounded-xl p-4`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center ${statusDisplay?.color === 'green' ? 'bg-green-100 text-green-600' :
                                        statusDisplay?.color === 'yellow' ? 'bg-amber-100 text-amber-600' :
                                            statusDisplay?.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                                                'bg-red-100 text-red-600'
                                        }`}>
                                        {todayAttendance.location === 'site' ? <MapPinIcon className="w-5 h-5 lg:w-6 lg:h-6" /> : <BuildingOfficeIcon className="w-5 h-5 lg:w-6 lg:h-6" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-800 font-semibold text-sm lg:text-base capitalize">
                                            {todayAttendance.location}{todayAttendance.siteName ? ` - ${todayAttendance.siteName}` : ''}
                                        </p>
                                        <p className={`text-xs lg:text-sm ${statusDisplay?.color === 'green' ? 'text-green-600' :
                                            statusDisplay?.color === 'yellow' ? 'text-amber-600' :
                                                statusDisplay?.color === 'orange' ? 'text-orange-600' :
                                                    'text-red-600'
                                            }`}>
                                            {statusDisplay?.icon} {statusDisplay?.text}
                                        </p>
                                    </div>
                                </div>

                                {/* Show correction button only if not already pending and within correction limit */}
                                {todayAttendance.status !== 'pending' && correctionCount < MAX_CORRECTIONS_PER_DAY && (
                                    <button
                                        className="mt-3 flex items-center gap-1 text-xs lg:text-sm text-indigo-600 font-medium hover:text-indigo-800 hover:underline"
                                        onClick={openCorrectionModal}
                                    >
                                        <PencilSquareIcon className="w-4 h-4" />
                                        Raise Correction Request ({MAX_CORRECTIONS_PER_DAY - correctionCount} left)
                                    </button>
                                )}
                                {/* Show message when corrections exhausted */}
                                {correctionCount >= MAX_CORRECTIONS_PER_DAY && (
                                    <p className="mt-3 text-xs text-red-500 font-medium">
                                        Daily correction limit reached ({MAX_CORRECTIONS_PER_DAY}/{MAX_CORRECTIONS_PER_DAY})
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Sunday Logic - Only show if NO attendance marked yet */}
                        {!todayAttendance && isSunday(currentTime) && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-blue-800 font-medium text-center mb-2">Today is a Holiday by default.</p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full text-blue-600 text-sm font-semibold hover:text-blue-800 hover:underline"
                                >
                                    Mark Work Attendance (If You Worked Today)
                                </button>
                            </div>
                        )}

                        {/* Normal Day Logic - Show Mark Button if NO attendance marked and NOT Sunday */}
                        {!todayAttendance && !isSunday(currentTime) && (
                            <button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 lg:py-4 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 lg:text-lg"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                Mark Today's Attendance
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Stats Card - Desktop Only */}
                <div className="hidden lg:block bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                    <h3 className="text-xl font-semibold text-slate-800 mb-6">This Month</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-indigo-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-indigo-600">--</p>
                            <p className="text-xs text-indigo-600/70 font-medium mt-1">Office Days</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-orange-600">--</p>
                            <p className="text-xs text-orange-600/70 font-medium mt-1">Site Days</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-red-600">--</p>
                            <p className="text-xs text-red-600/70 font-medium mt-1">Leave Days</p>
                        </div>
                    </div>
                </div>
            </div>

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
