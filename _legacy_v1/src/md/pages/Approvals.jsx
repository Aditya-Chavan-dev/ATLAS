import React, { useState, useEffect } from 'react'
import { ref, onValue, update, push } from 'firebase/database'
import { database } from '@/firebase/config'
import { useAuth } from '@/context/AuthContext'
import { format } from 'date-fns'
import { time } from '@/utils/time'
import {
    CheckCircle, XCircle, Clock, Calendar, MapPin,
    AlertTriangle, Filter, Archive, User, ArrowRight
} from 'lucide-react'
import clsx from 'clsx'

// UI Components
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import MDToast from '../components/MDToast'
import ApiService from '@/services/api'

export default function MDApprovals() {
    const { userProfile, currentUser } = useAuth()
    const [approvals, setApprovals] = useState([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState(null)
    const [filter, setFilter] = useState('pending') // 'pending' | 'history'
    const [toast, setToast] = useState(null)

    // Modal State
    const [rejectModal, setRejectModal] = useState({ isOpen: false, item: null, reason: '' })
    const [approveModal, setApproveModal] = useState({ isOpen: false, item: null })

    // Data Fetching
    useEffect(() => {
        const usersRef = ref(database, 'employees')
        const leavesRef = ref(database, 'leaves')

        let rawUsers = {}
        let rawLeaves = {}

        const updateData = () => {
            const attItems = []
            Object.entries(rawUsers).forEach(([uid, userData]) => {
                // Handle different data structures (userData might be direct or have 'profile')
                const profile = userData.profile || userData
                const name = profile.name || userData.name || userData.email || 'Unknown Employee'
                const email = profile.email || userData.email || ''

                const attendanceRecords = userData.attendance || {}
                Object.entries(attendanceRecords).forEach(([date, record]) => {
                    const isPending = ['pending', 'correction_pending', 'edit_pending', 'pending_co'].includes(record.status)
                    // If filtering for pending, only include pending. If history, include everything.
                    // But here we fetch everything and filter in render or just specific statuses?
                    // The original code filtered strictly.
                    // Let's grab all relevant ones.

                    if (isPending || record.status === 'approved' || record.status === 'rejected') {
                        attItems.push({
                            id: date,
                            employeeUid: uid,
                            date,
                            ...record,
                            reqType: 'attendance',
                            employeeName: name,
                            employeeEmail: email,
                            isPending: isPending
                        })
                    }
                })
            })

            const leaveItems = []
            Object.entries(rawLeaves).forEach(([uid, userLeaves]) => {
                const userObj = rawUsers[uid] || {}
                const profile = userObj.profile || userObj
                const name = profile.name || userObj.name || userObj.email || 'Unknown'

                Object.entries(userLeaves).forEach(([leaveId, leave]) => {
                    const isPending = leave.status === 'pending' || leave.status === 'auto-blocked'
                    leaveItems.push({
                        id: leaveId,
                        ...leave,
                        reqType: 'leave',
                        uid,
                        employeeName: name,
                        isPending
                    })
                })
            })

            const merged = [...attItems, ...leaveItems].sort((a, b) => {
                return (b.timestamp || b.appliedAt || 0) - (a.timestamp || a.appliedAt || 0)
            })

            setApprovals(merged)
            setLoading(false)
        }

        const unsubUsers = onValue(usersRef, snap => { rawUsers = snap.val() || {}; updateData() })
        const unsubLeaves = onValue(leavesRef, snap => { rawLeaves = snap.val() || {}; updateData() })

        return () => { unsubUsers(); unsubLeaves() }
    }, [])

    const handleAction = async (item, status, reason = '') => {
        setProcessingId(item.id)

        try {
            if (item.reqType === 'leave') {
                // STRICT MODE: Use API for Approval to ensure balance deduction
                if (status === 'approved') {
                    await ApiService.post('/api/leave/approve', {
                        leaveId: item.id,
                        employeeId: item.uid,
                        mdId: currentUser.uid,
                        mdName: userProfile?.email || 'MD'
                    })
                } else {
                    const leaveRef = ref(database, `leaves/${item.uid}/${item.id}`)
                    await update(leaveRef, {
                        status: status,
                        actionData: {
                            by: currentUser.uid,
                            name: userProfile?.email || 'MD',
                            at: time.now(),
                            reason: reason || ''
                        }
                    })
                }
            } else {
                // Use backend API for transactional notification
                await ApiService.post('/api/attendance/status', {
                    employeeUid: item.employeeUid,
                    date: item.date,
                    status: status,
                    reason: reason || null,
                    actionData: {
                        name: userProfile?.email || 'MD'
                    }
                })
            }
            // Strict Mode: We do NOT update the list locally. 
            // We wait for the Firebase onValue listener to reflect the change from the backend.
            setToast({ type: 'success', message: `Request ${status} successfully` })
        } catch (error) {
            console.error("Error updating status:", error)
            setToast({ type: 'error', message: "Failed to update status" })
        } finally {
            setProcessingId(null)
            setRejectModal({ isOpen: false, item: null, reason: '' })
            setApproveModal({ isOpen: false, item: null })
        }
    }

    const confirmReject = () => {
        const { item, reason } = rejectModal
        if (!item) return
        if (!reason.trim()) {
            setToast({ type: 'warning', message: "Please provide a reason for rejection" })
            return
        }
        handleAction(item, 'rejected', reason)
    }

    const handleApproveClick = (item) => {
        if (item.reqType === 'leave') {
            setApproveModal({ isOpen: true, item })
        } else {
            handleAction(item, 'approved')
        }
    }

    const filteredApprovals = approvals.filter(item => {
        if (filter === 'pending') return item.isPending
        if (filter === 'history') return !item.isPending
        return true
    })

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {toast && <MDToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Approvals</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage pending requests</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                    onClick={() => setFilter('pending')}
                    className={clsx(
                        "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                        filter === 'pending'
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                >
                    Pending
                </button>
                <button
                    onClick={() => setFilter('history')}
                    className={clsx(
                        "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                        filter === 'history'
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                >
                    History
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading requests...</p>
                </div>
            ) : filteredApprovals.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        {filter === 'pending' ? <CheckCircle size={32} /> : <Archive size={32} />}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No requests found</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                        {filter === 'pending'
                            ? "You're all caught up! There are no pending requests requiring your attention."
                            : "No history of requests available."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredApprovals.map(item => (
                        <RequestCard
                            key={item.id + item.reqType}
                            item={item}
                            onApprove={() => handleApproveClick(item)}
                            onReject={() => setRejectModal({ isOpen: true, item, reason: '' })}
                            isProcessing={processingId === item.id}
                            isHistory={filter === 'history'}
                        />
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            <Modal
                isOpen={rejectModal.isOpen}
                onClose={() => setRejectModal({ ...rejectModal, isOpen: false })}
                title="Reject Request"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setRejectModal({ ...rejectModal, isOpen: false })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger-solid"
                            onClick={confirmReject}
                        >
                            Confirm Rejection
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-lg flex gap-3 text-sm">
                        <AlertTriangle className="shrink-0 w-5 h-5" />
                        <p>This action will notify the employee that their request has been rejected.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Reason for Rejection <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32"
                            placeholder="e.g., Inadequate leave balance, Critical project delivery..."
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                            autoFocus
                        />
                    </div>
                </div>
            </Modal>

            {/* Approve Confirmation Modal */}
            <Modal
                isOpen={approveModal.isOpen}
                onClose={() => setApproveModal({ isOpen: false, item: null })}
                title="Confirm Leave Approval"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setApproveModal({ isOpen: false, item: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleAction(approveModal.item, 'approved')}
                        >
                            Confirm Approval
                        </Button>
                    </>
                }
            >
                {approveModal.item && (
                    <div className="space-y-4">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-center gap-2 mb-3 text-indigo-800 dark:text-indigo-300 font-bold uppercase tracking-wider text-xs">
                                <Calendar className="w-4 h-4" /> Leave Request Review
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-600 dark:text-slate-400 text-sm">Employee:</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{approveModal.item.employeeName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold">Duration</p>
                                    <p className="text-slate-900 dark:text-white font-mono text-lg">{approveModal.item.totalDays} Days</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold">Type</p>
                                    <p className="text-slate-900 dark:text-white font-bold">{approveModal.item.type}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
                                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Date Range</p>
                                <p className="text-indigo-700 dark:text-indigo-400 font-bold text-lg">
                                    {format(new Date(approveModal.item.from), 'do MMM yyyy')} - {format(new Date(approveModal.item.to), 'do MMM yyyy')}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 text-center">
                            Are you sure you want to approve this request?
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    )
}

const RequestCard = ({ item, onApprove, onReject, isProcessing, isHistory }) => {
    const isLeave = item.reqType === 'leave'
    const isCorrection = !isLeave && (item.status === 'correction_pending' || item.isCorrection)

    // Helper for display
    const formatDate = (dateStr) => {
        try { return format(new Date(dateStr), 'MMM dd, yyyy') } catch { return dateStr }
    }

    const getLocationDisplay = () => {
        if (item.locationType === 'Site') {
            return item.siteName || 'Unknown Site'
        }
        if (item.location === 'office' || item.locationType === 'Office') {
            return 'Office'
        }
        return item.location || 'Unknown Location'
    }

    return (
        <Card className={clsx(
            "p-5 transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950",
            !isHistory && "hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-md",
            isLeave && "border-l-4 border-l-indigo-600 shadow-indigo-100 dark:shadow-none bg-indigo-50/10"
        )}>
            <div className="flex flex-col gap-4">

                {/* header part with avatar and name */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                        {(item.employeeName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
                            {item.employeeName || 'Unknown Employee'}
                        </h3>
                        {item.employeeEmail && <div className="text-xs text-slate-500">{item.employeeEmail}</div>}
                    </div>
                    <div className="ml-auto">
                        {isLeave ? (
                            <Badge variant="warning" className="uppercase tracking-wider text-[10px]">Leave Request</Badge>
                        ) : isCorrection ? (
                            <Badge variant="warning" className="uppercase tracking-wider text-[10px] bg-orange-100 text-orange-700">Correction</Badge>
                        ) : item.status === 'pending_co' ? (
                            <Badge variant="warning" className="uppercase tracking-wider text-[10px] bg-purple-100 text-purple-700">Comp Off</Badge>
                        ) : (
                            <Badge variant="info" className="uppercase tracking-wider text-[10px]">Attendance</Badge>
                        )}
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                {/* Content Details */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4">
                    {isLeave ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Calendar size={18} className="text-indigo-500" />
                                <div>
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        {format(new Date(item.from), 'do MMM yyyy')} - {format(new Date(item.to), 'do MMM yyyy')}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {item.totalDays} Day{item.totalDays > 1 ? 's' : ''} &bull; {item.type}
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm italic text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                                "{item.reason || 'No reason provided'}"
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 tracking-wider">
                                        <Calendar size={12} /> Date
                                    </div>
                                    <div className="font-mono text-sm text-slate-700 dark:text-slate-300 font-semibold">
                                        {formatDate(item.date)}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 tracking-wider">
                                        <Clock size={12} /> Status
                                    </div>
                                    <div className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                                        Check In
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 tracking-wider">
                                    <MapPin size={12} /> Location
                                </div>
                                <div className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                                    {getLocationDisplay()}
                                </div>
                            </div>

                            {isCorrection && (
                                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-100 dark:border-orange-900/30 text-xs">
                                    <div className="font-semibold text-orange-800 dark:text-orange-200 mb-1">Correction Details:</div>
                                    <div className="text-orange-700 dark:text-orange-300">
                                        Previous: <span className="line-through opacity-70">{item.previousLocation}</span> <ArrowRight size={10} className="inline mx-1" /> New: <span className="font-bold">{item.location}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions (Only for Pending) */}
                {!isHistory && (
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-6"
                            onClick={onReject}
                            disabled={isProcessing}
                        >
                            Reject
                        </Button>
                        <Button
                            variant="primary"
                            className="bg-blue-600 hover:bg-blue-700 text-white border-none px-6 shadow-lg shadow-blue-500/20"
                            icon={CheckCircle}
                            onClick={onApprove}
                            loading={isProcessing}
                        >
                            Approve Request
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    )
}
