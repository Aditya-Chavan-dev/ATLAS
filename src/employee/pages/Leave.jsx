import { useState, useEffect } from 'react'
import { ref, push, onValue } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { formatDate, getTodayString } from '../../utils/dateUtils'
import RefinedModal from '../../components/ui/RefinedModal'

export default function EmployeeLeave() {
    const { currentUser } = useAuth()
    const [activeTab, setActiveTab] = useState('apply') // 'apply' or 'status'
    const [leaveType, setLeaveType] = useState('Sick Leave')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [reason, setReason] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [leaveRequests, setLeaveRequests] = useState([])

    const [dateError, setDateError] = useState('')
    const [showLongLeaveWarning, setShowLongLeaveWarning] = useState(false)
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        primaryAction: null,
        secondaryAction: null
    })

    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }))

    const showMessage = (title, message, type = 'info') => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            primaryAction: null,
            secondaryAction: null
        })
    }

    useEffect(() => {
        if (!currentUser) return

        const leavesRef = ref(database, `leaveRequests/${currentUser.uid}`)

        const unsubscribe = onValue(leavesRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const loadedLeaves = Object.entries(data).map(([id, val]) => ({
                    id,
                    ...val
                })).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
                setLeaveRequests(loadedLeaves)
            } else {
                setLeaveRequests([])
            }
        })

        return () => unsubscribe()
    }, [currentUser])

    // Calculate leave duration in days
    const calculateLeaveDays = (start, end) => {
        if (!start || !end) return 0
        const startD = new Date(start)
        const endD = new Date(end)
        const diffTime = Math.abs(endD - startD)
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days
    }

    // Validate dates
    const validateDates = (start, end) => {
        if (!start || !end) {
            setDateError('')
            setShowLongLeaveWarning(false)
            return true
        }

        const startD = new Date(start)
        const endD = new Date(end)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Check if start date is in the past
        const startCheck = new Date(start)
        startCheck.setHours(0, 0, 0, 0)

        if (startCheck < today) {
            setDateError('Start date cannot be in the past')
            setShowLongLeaveWarning(false)
            return false
        }

        if (endD < startD) {
            setDateError('End date cannot be before start date')
            setShowLongLeaveWarning(false)
            return false
        }

        const diffDays = calculateLeaveDays(start, end)

        // Check if leave is more than 30 days - show warning but allow
        if (diffDays > 30) {
            setShowLongLeaveWarning(true)
        } else {
            setShowLongLeaveWarning(false)
        }

        setDateError('')
        return true
    }

    const handleStartDateChange = (value) => {
        setStartDate(value)
        validateDates(value, endDate)
    }

    const handleEndDateChange = (value) => {
        setEndDate(value)
        validateDates(startDate, value)
    }

    const handleVerifyAndSubmit = (e) => {
        e.preventDefault()
        if (!currentUser) return
        if (!validateDates(startDate, endDate)) return

        // If there's a warning, ask for confirmation via Modal
        if (showLongLeaveWarning) {
            setModalConfig({
                isOpen: true,
                title: 'Extended Leave Request',
                message: `You are requesting leave for more than 30 days (${calculateLeaveDays(startDate, endDate)} days).\n\nPlease verify the dates are correct. Do you want to proceed with this request?`,
                type: 'warning',
                primaryAction: {
                    label: 'Yes, Proceed',
                    onClick: () => {
                        closeModal()
                        processLeaveSubmission()
                    }
                },
                secondaryAction: {
                    label: 'Cancel',
                    onClick: closeModal
                }
            })
            return
        }

        processLeaveSubmission()
    }

    const processLeaveSubmission = async () => {
        setIsSubmitting(true)

        try {
            const leaveDays = calculateLeaveDays(startDate, endDate)
            const leavesRef = ref(database, `leaveRequests/${currentUser.uid}`)
            await push(leavesRef, {
                type: leaveType,
                startDate,
                endDate,
                isLongLeave: leaveDays > 30 // Flag for MD to see
            })

            // Reset form
            setLeaveType('Sick Leave')
            setStartDate('')
            setEndDate('')
            setReason('')
            setShowLongLeaveWarning(false)
            setActiveTab('status')

            showMessage('Success', 'Leave request submitted successfully!', 'success')
        } catch (error) {
            console.error("Error submitting leave:", error)

            // Provide specific error messages based on error type
            let errorMessage = "Failed to submit leave request."

            if (error.code === 'PERMISSION_DENIED') {
                errorMessage = "Permission denied. You don't have access to submit leave requests."
            } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
                errorMessage = "Network error. Please check your internet connection and try again."
            } else if (error.code === 'UNAVAILABLE') {
                errorMessage = "Service temporarily unavailable. Please try again in a few moments."
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`
            }

            showMessage('Submission Failed', errorMessage, 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-3xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Leave Management</h2>
                    <p className="text-slate-500 mt-1">Apply for leave and track your request status</p>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 space-x-1 bg-white border border-slate-200 rounded-xl shadow-sm w-full md:w-auto">
                    <button
                        className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex-1 md:flex-none
                            ${activeTab === 'apply'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => setActiveTab('apply')}
                    >
                        Apply Leave
                    </button>
                    <button
                        className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex-1 md:flex-none
                            ${activeTab === 'status'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => setActiveTab('status')}
                    >
                        History & Status
                    </button>
                </div>
            </div>

            {/* Apply Leave Form */}
            {activeTab === 'apply' && (
                <form onSubmit={handleVerifyAndSubmit} className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-100 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full -mr-10 -mt-10 pointer-events-none" />

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Leave Type</label>
                        <div className="relative">
                            <select
                                value={leaveType}
                                onChange={(e) => setLeaveType(e.target.value)}
                                className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-3.5 px-4 bg-slate-50 hover:bg-white transition-colors appearance-none cursor-pointer font-medium text-slate-700"
                            >
                                <option>Sick Leave</option>
                                <option>Casual Leave</option>
                                <option>Emergency Leave</option>
                                <option>Personal Leave</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                required
                                min={getTodayString()}
                                value={startDate}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-3.5 px-4 bg-slate-50 hover:bg-white transition-colors font-medium text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
                            <input
                                type="date"
                                required
                                min={startDate || getTodayString()}
                                value={endDate}
                                onChange={(e) => handleEndDateChange(e.target.value)}
                                className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-3.5 px-4 bg-slate-50 hover:bg-white transition-colors font-medium text-slate-700"
                            />
                        </div>
                    </div>

                    {/* Leave duration display */}
                    {startDate && endDate && !dateError && (
                        <div className="p-3 bg-indigo-50 text-indigo-700 text-sm rounded-xl border border-indigo-100">
                            <span className="font-semibold">Duration:</span> {calculateLeaveDays(startDate, endDate)} day{calculateLeaveDays(startDate, endDate) > 1 ? 's' : ''}
                        </div>
                    )}

                    {/* Date Error */}
                    {dateError && (
                        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start gap-3 animate-fade-in">
                            <XCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                            <span className="font-medium">{dateError}</span>
                        </div>
                    )}

                    {/* Long Leave Warning */}
                    {showLongLeaveWarning && (
                        <div className="p-4 bg-amber-50 text-amber-800 text-sm rounded-xl border border-amber-200 flex items-start gap-3 animate-fade-in">
                            <ExclamationTriangleIcon className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                            <div>
                                <p className="font-semibold">Extended Leave Request</p>
                                <p className="text-amber-700 mt-1">
                                    You are requesting leave for more than 30 days ({calculateLeaveDays(startDate, endDate)} days).
                                    Please verify your dates are correct. This will be flagged for MD review.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Reason Field Removed */}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || !!dateError}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Leave Request'
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* Status List */}
            {activeTab === 'status' && (
                <div className="space-y-4">
                    {leaveRequests.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ClockIcon className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="font-medium">No leave requests found.</p>
                            <p className="text-sm mt-1">Your leave history will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {leaveRequests.map((request) => (
                                <div key={request.id} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between group gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0
                                            ${request.status === 'Approved' ? 'bg-green-100 text-green-600' :
                                                request.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                                                    'bg-yellow-100 text-yellow-600'}`}>
                                            {request.status === 'Approved' ? <CheckCircleIcon className="w-6 h-6" /> :
                                                request.status === 'Rejected' ? <XCircleIcon className="w-6 h-6" /> :
                                                    <ClockIcon className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                <span className="font-bold text-slate-800 text-lg">{request.type}</span>
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide
                                                    ${request.status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                        request.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                            'bg-yellow-50 text-yellow-700 border border-yellow-100'}`}>
                                                    {request.status}
                                                </span>
                                                {request.isLongLeave && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                        Extended Leave
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                                <span>{formatDate(request.startDate)}</span>
                                                <span className="text-slate-300">→</span>
                                                <span>{formatDate(request.endDate)}</span>
                                                {request.leaveDays && (
                                                    <span className="text-slate-400">({request.leaveDays} days)</span>
                                                )}
                                            </div>
                                            {request.reason && (
                                                <p className="text-sm text-slate-400 mt-2 line-clamp-1">"{request.reason}"</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right pl-16 sm:pl-0">
                                        <p className="text-xs text-slate-400 font-medium">Applied on</p>
                                        <p className="text-sm text-slate-600 font-medium">{formatDate(request.appliedAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {/* Modal */}
            <RefinedModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                primaryAction={modalConfig.primaryAction}
                secondaryAction={modalConfig.secondaryAction}
            />
        </div>
    )
}
