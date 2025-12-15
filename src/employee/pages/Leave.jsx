// Leave Page - Clean Professional UI
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    PlusIcon,
    CalendarIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline'
import { formatDate, getTodayString } from '../../utils/dateUtils'
import RefinedModal from '../../components/ui/RefinedModal'
import { ref, onValue, push, set, remove } from 'firebase/database'
import { database } from '../../firebase/config'
import ApiService from '../../services/api'

export default function EmployeeLeave() {
    const { currentUser, userProfile } = useAuth()
    const [activeTab, setActiveTab] = useState('apply')
    const [leaveType, setLeaveType] = useState('Casual Leave')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [reason, setReason] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [leaveRequests, setLeaveRequests] = useState([])
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' })

    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }))

    const showMessage = (title, message, type = 'info') => {
        setModalConfig({ isOpen: true, title, message, type, primaryAction: null, secondaryAction: null })
    }

    useEffect(() => {
        if (!currentUser) return
        const leavesRef = ref(database, `leaves/${currentUser.uid}`)
        const unsubscribe = onValue(leavesRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const loadedLeaves = Object.entries(data)
                    .map(([key, val]) => ({ ...val, leaveId: key }))
                    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
                setLeaveRequests(loadedLeaves)
            } else {
                setLeaveRequests([])
            }
        })
        return () => unsubscribe()
    }, [currentUser])

    const calculateLeaveDays = (start, end) => {
        if (!start || !end) return 0
        const startD = new Date(start)
        const endD = new Date(end)
        const diffTime = endD - startD
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }

    const submitLeave = async () => {
        if (!startDate || !endDate) {
            showMessage('Error', 'Please select start and end dates', 'error')
            return
        }

        setIsSubmitting(true)
        try {
            try {
                await ApiService.post('/api/leave/apply', {
                    employeeId: currentUser.uid,
                    employeeName: userProfile?.name || currentUser.email,
                    type: leaveType === 'Casual Leave' ? 'CL' : 'SL',
                    from: startDate,
                    to: endDate,
                    reason
                })
                showMessage('Success', 'Leave request submitted!', 'success')
            } catch (apiError) {
                console.warn('API submission failed, falling back to Firebase:', apiError)
                const leavesRef = ref(database, `leaves/${currentUser.uid}`)
                const newLeaveRef = push(leavesRef)
                const leaveId = newLeaveRef.key

                const leaveData = {
                    leaveId,
                    employeeId: currentUser.uid,
                    employeeName: userProfile?.name || currentUser.email,
                    employeeEmail: currentUser.email,
                    type: leaveType === 'Casual Leave' ? 'CL' : 'SL',
                    from: startDate,
                    to: endDate,
                    reason,
                    status: 'pending',
                    appliedAt: new Date().toISOString(),
                    totalDays: calculateLeaveDays(startDate, endDate)
                }

                await set(newLeaveRef, leaveData)
                showMessage('Success', 'Leave request submitted!', 'success')
            }

            setStartDate('')
            setEndDate('')
            setReason('')
            setActiveTab('status')
        } catch (error) {
            showMessage('Submission Failed', error.message, 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFormSubmit = (e) => {
        e.preventDefault()
        submitLeave()
    }

    const handleCancel = async (leaveId) => {
        if (!confirm('Cancel this leave request?')) return
        try {
            const leavesRef = ref(database, `leaves/${currentUser.uid}/${leaveId}`)
            await remove(leavesRef)
            showMessage('Cancelled', 'Leave request cancelled.', 'success')
        } catch (error) {
            showMessage('Error', error.message, 'error')
        }
    }

    const getStatusBadge = (status) => {
        if (status === 'approved') {
            return (
                <span className="emp-badge success">
                    <span className="emp-status-dot success"></span>
                    Approved
                </span>
            )
        }
        if (status === 'rejected') {
            return (
                <span className="emp-badge danger">
                    <span className="emp-status-dot danger"></span>
                    Rejected
                </span>
            )
        }
        return (
            <span className="emp-badge warning">
                <span className="emp-status-dot warning"></span>
                Pending
            </span>
        )
    }

    // Count stats
    const pendingCount = leaveRequests.filter(r => r.status === 'pending').length
    const approvedCount = leaveRequests.filter(r => r.status === 'approved').length

    return (
        <div className="space-y-6 emp-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--emp-text-primary)' }}>
                        Leave Application
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--emp-text-muted)' }}>
                        Apply and track your leave requests
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1 rounded-lg" style={{ background: 'var(--emp-bg-secondary)' }}>
                    <button
                        onClick={() => setActiveTab('apply')}
                        className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                        style={{
                            background: activeTab === 'apply' ? 'var(--emp-accent)' : 'transparent',
                            color: activeTab === 'apply' ? '#ffffff' : 'var(--emp-text-muted)'
                        }}
                    >
                        Apply
                    </button>
                    <button
                        onClick={() => setActiveTab('status')}
                        className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                        style={{
                            background: activeTab === 'status' ? 'var(--emp-accent)' : 'transparent',
                            color: activeTab === 'status' ? '#ffffff' : 'var(--emp-text-muted)'
                        }}
                    >
                        History
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="emp-stat-card">
                    <p className="emp-stat-value" style={{ color: 'var(--emp-warning)' }}>{pendingCount}</p>
                    <p className="emp-stat-label">Pending</p>
                </div>
                <div className="emp-stat-card">
                    <p className="emp-stat-value" style={{ color: 'var(--emp-success)' }}>{approvedCount}</p>
                    <p className="emp-stat-label">Approved</p>
                </div>
            </div>

            {activeTab === 'apply' && (
                <div className="space-y-4">
                    {/* Leave Form */}
                    <div className="emp-card">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--emp-text-primary)' }}>
                            <PlusIcon className="w-4 h-4" style={{ color: 'var(--emp-accent)' }} />
                            New Request
                        </h3>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {/* Leave Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--emp-text-secondary)' }}>
                                    Leave Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setLeaveType('Casual Leave')}
                                        className="p-3 rounded-lg text-sm font-medium transition-all"
                                        style={{
                                            background: leaveType === 'Casual Leave' ? 'var(--emp-accent-glow)' : 'var(--emp-bg-secondary)',
                                            color: leaveType === 'Casual Leave' ? 'var(--emp-accent)' : 'var(--emp-text-secondary)',
                                            border: `1px solid ${leaveType === 'Casual Leave' ? 'var(--emp-accent)' : 'var(--emp-border)'}`
                                        }}
                                    >
                                        Casual Leave
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLeaveType('Sick Leave')}
                                        className="p-3 rounded-lg text-sm font-medium transition-all"
                                        style={{
                                            background: leaveType === 'Sick Leave' ? 'rgba(239, 68, 68, 0.1)' : 'var(--emp-bg-secondary)',
                                            color: leaveType === 'Sick Leave' ? 'var(--emp-danger)' : 'var(--emp-text-secondary)',
                                            border: `1px solid ${leaveType === 'Sick Leave' ? 'var(--emp-danger)' : 'var(--emp-border)'}`
                                        }}
                                    >
                                        Sick Leave
                                    </button>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--emp-text-secondary)' }}>
                                        From
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            required
                                            min={getTodayString()}
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="emp-input pl-10"
                                        />
                                        <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--emp-text-muted)' }} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--emp-text-secondary)' }}>
                                        To
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            required
                                            min={startDate || getTodayString()}
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="emp-input pl-10"
                                        />
                                        <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--emp-text-muted)' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Duration */}
                            {startDate && endDate && (
                                <div className="p-3 rounded-lg flex justify-between items-center" style={{ background: 'var(--emp-accent-glow)' }}>
                                    <span className="text-sm" style={{ color: 'var(--emp-text-secondary)' }}>Duration</span>
                                    <span className="text-sm font-bold" style={{ color: 'var(--emp-accent)' }}>
                                        {calculateLeaveDays(startDate, endDate)} Days
                                    </span>
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--emp-text-secondary)' }}>
                                    Reason (Optional)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    className="emp-input resize-none"
                                    placeholder="Brief reason for leave..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="emp-btn w-full py-3"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'status' && (
                <div className="emp-card p-0 overflow-hidden">
                    {leaveRequests.length === 0 ? (
                        <div className="p-8 text-center">
                            <DocumentTextIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--emp-text-muted)' }} />
                            <p style={{ color: 'var(--emp-text-muted)' }}>No leave requests yet</p>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="emp-table-header">
                                <span>Date Range</span>
                                <span>Type</span>
                                <span>Status</span>
                            </div>

                            {/* Leave Requests */}
                            {leaveRequests.map((req) => (
                                <div key={req.leaveId} className="emp-table-row">
                                    <div>
                                        <p className="font-medium text-sm" style={{ color: 'var(--emp-text-primary)' }}>
                                            {formatDate(req.from)}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--emp-text-muted)' }}>
                                            to {formatDate(req.to)}
                                        </p>
                                    </div>
                                    <span className="text-sm" style={{ color: 'var(--emp-text-secondary)' }}>
                                        {req.type}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(req.status)}
                                        {req.status === 'pending' && (
                                            <button
                                                onClick={() => handleCancel(req.leaveId)}
                                                className="p-1.5 rounded-md transition-all"
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--emp-danger)' }}
                                            >
                                                <XCircleIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

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
