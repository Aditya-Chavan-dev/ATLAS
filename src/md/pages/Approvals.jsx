import React, { useState, useEffect } from 'react'
import { ref, onValue, update, push } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import {
    CheckCircle, XCircle, Clock, Calendar, MapPin,
    AlertTriangle, Filter, Archive
} from 'lucide-react'
import clsx from 'clsx'

// UI Components
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import MDToast from '../components/MDToast'
import ApiService from '../../services/api'

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
        // ... (No changes to useEffect content, but keeping context small)
        const usersRef = ref(database, 'users')
        const leavesRef = ref(database, 'leaves')
        // ...

        // ... (Use existing code for useEffect body)
        let rawUsers = {}
        let rawLeaves = {}

        const updateData = () => {
            const attItems = []
            Object.entries(rawUsers).forEach(([uid, userData]) => {
                const attendanceRecords = userData.attendance || {}
                Object.entries(attendanceRecords).forEach(([date, record]) => {
                    const isPending = ['pending', 'correction_pending', 'edit_pending', 'pending_co'].includes(record.status)
                    attItems.push({
                        id: date,
                        employeeUid: uid,
                        date,
                        ...record,
                        reqType: 'attendance',
                        employeeName: record.employeeName || userData.name || userData.email,
                        employeeEmail: record.employeeEmail || userData.email,
                        isPending
                    })
                })
            })

            const leaveItems = []
            Object.entries(rawLeaves).forEach(([uid, userLeaves]) => {
                Object.entries(userLeaves).forEach(([leaveId, leave]) => {
                    const isPending = leave.status === 'pending' || leave.status === 'auto-blocked'
                    leaveItems.push({
                        id: leaveId,
                        ...leave,
                        reqType: 'leave',
                        uid,
                        employeeName: rawUsers[uid]?.name || 'Unknown',
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
                    // For rejection, we can use direct update or API. 
                    // Let's use API to be consistent if previous steps set up rejection API.
                    // If not, keep existing firebase update for rejection is fine?
                    // Safe bet: Use what was working or update strictly.
                    // The previous file content shows direct update for leaves.
                    // I will switch approval to API as requested by "Strict Mode".

                    const leaveRef = ref(database, `leaves/${item.uid}/${item.id}`)
                    await update(leaveRef, {
                        status: status,
                        actionData: {
                            by: currentUser.uid,
                            name: userProfile?.email || 'MD',
                            at: new Date().toISOString(),
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

    const filteredApprovals = approvals.filter(item => item.isPending)

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {toast && <MDToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Approvals</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage pending requests</p>
                </div>

                {/* Filter Tabs Removed - Strict Queue Mode */}
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

    return (
        <Card className={clsx(
            "p-5 transition-all border border-slate-200 dark:border-slate-800",
            !isHistory && "hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-md",
            isLeave && "border-l-4 border-l-indigo-600 shadow-indigo-100 dark:shadow-none bg-indigo-50/10"
        )}>
            <div className="flex flex-col md:flex-row gap-5 items-start">

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300 shrink-0">
                    {(item.employeeName || 'U').charAt(0)}
                </div>

                {/* Content */}
                <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{item.employeeName}</h3>
                            <div className="text-xs text-slate-500">{item.employeeEmail}</div>
                        </div>
                        <div className="flex gap-2">
                            {isLeave ? (
                                <Badge variant="warning" className="uppercase tracking-wider text-[10px]">Leave Request</Badge>
                            ) : isCorrection ? (
                                <Badge variant="warning" className="uppercase tracking-wider text-[10px] bg-orange-100 text-orange-700">Correction</Badge>
                            ) : item.status === 'pending_co' ? (
                                <Badge variant="warning" className="uppercase tracking-wider text-[10px] bg-purple-100 text-purple-700">Comp Off Earn Request</Badge>
                            ) : (
                                <Badge variant="info" className="uppercase tracking-wider text-[10px]">Attendance</Badge>
                            )}
                            {isHistory && (
                                <Badge variant={item.status === 'approved' ? 'success' : 'error'} className="capitalize">
                                    {item.status}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className={clsx(
                        "rounded-xl mt-3 transition-colors",
                        !isLeave && "bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2"
                    )}>
                        {isLeave ? (
                            <div className="space-y-4 py-1">
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                                        <Calendar size={22} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">
                                            {format(new Date(item.from), 'do MMM yyyy')} - {format(new Date(item.to), 'do MMM yyyy')}
                                        </div>
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">
                                            {item.totalDays} Day{item.totalDays > 1 ? 's' : ''} &bull; <span className="text-indigo-600 dark:text-indigo-400">{item.type} Leave</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pl-12">
                                    <div className="relative text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl text-sm italic">
                                        "{item.reason || 'No reason provided'}"
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <Calendar size={16} className="text-slate-400" />
                                        <span>{formatDate(item.date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <Clock size={16} className="text-slate-400" />
                                        <span>Check In</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <MapPin size={16} className="text-slate-400" />
                                        <span className="capitalize">{item.location === 'office' ? 'Office' : item.location}</span>
                                    </div>
                                </div>
                                {isCorrection && (
                                    <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-100 dark:border-orange-900/30 text-xs">
                                        <div className="font-semibold text-orange-800 dark:text-orange-200 mb-1">Correction Details:</div>
                                        <div className="text-orange-700 dark:text-orange-300">
                                            Location: <span className="line-through opacity-70">{item.previousLocation}</span> <ArrowRight size={10} className="inline mx-1" /> <span className="font-bold">{item.location}</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions (Only for Pending) */}
            {!isHistory && (
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={onReject}
                        disabled={isProcessing}
                    >
                        Reject
                    </Button>
                    <Button
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20 text-white border-none"
                        icon={CheckCircle}
                        onClick={onApprove}
                        loading={isProcessing}
                    >
                        Approve Request
                    </Button>
                </div>
            )}
        </Card>
    )
}
