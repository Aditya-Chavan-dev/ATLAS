import { useState, useEffect } from 'react'
import { ref, onValue, update, push, set } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import RefinedModal from '../../components/ui/RefinedModal'
import ApiService from '../../services/api'
import './Approvals.css'

function MDApprovals() {
    const { userProfile, currentUser } = useAuth()
    const [approvals, setApprovals] = useState([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState(null)

    // UI State
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' })
    const [rejectModal, setRejectModal] = useState({ isOpen: false, item: null, reason: '' })

    const showMessage = (title, message, type = 'info') => {
        setModalConfig({ isOpen: true, title, message, type })
    }

    const closeMainModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }))

    const [rawEmployees, setRawEmployees] = useState({})
    const [rawLeaves, setRawLeaves] = useState({})

    useEffect(() => {
        // NEW: Query /employees which contains nested attendance
        const employeesRef = ref(database, 'employees')
        const leavesRef = ref(database, 'leaves')

        const unsubEmployees = onValue(employeesRef, (snapshot) => {
            setRawEmployees(snapshot.val() || {})
        })

        const unsubLeaves = onValue(leavesRef, (snapshot) => {
            setRawLeaves(snapshot.val() || {})
        })

        return () => {
            unsubEmployees()
            unsubLeaves()
        }
    }, [])

    useEffect(() => {
        // Build attendance items from nested structure
        const attItems = []
        Object.entries(rawEmployees).forEach(([uid, empData]) => {
            const attendanceRecords = empData.attendance || {}
            Object.entries(attendanceRecords).forEach(([date, record]) => {
                if (
                    record.status === 'pending' ||
                    record.status === 'correction_pending' ||
                    record.status === 'edit_pending'
                ) {
                    attItems.push({
                        id: date, // Use date as ID for nested structure
                        employeeUid: uid, // Store employee UID for updates
                        date,
                        ...record,
                        reqType: 'attendance',
                        employeeName: record.employeeName || empData.name,
                        employeeEmail: record.employeeEmail || empData.email
                    })
                }
            })
        })

        const leaveItems = []
        Object.entries(rawLeaves).forEach(([uid, userLeaves]) => {
            Object.entries(userLeaves).forEach(([leaveId, leave]) => {
                if (leave.status === 'pending' || leave.status === 'auto-blocked') {
                    leaveItems.push({
                        id: leaveId,
                        ...leave,
                        reqType: 'leave',
                        uid // Ensure uid is passed for approvals
                    })
                }
            })
        })

        const merged = [...attItems, ...leaveItems].sort((a, b) => {
            const timeA = a.timestamp || a.appliedAt || 0
            const timeB = b.timestamp || b.appliedAt || 0
            return timeB - timeA
        })

        setApprovals(merged)
        setLoading(false)
    }, [rawEmployees, rawLeaves])

    const handleAction = async (item, status, reason = '') => {
        setProcessingId(item.id)
        try {
            if (item.reqType === 'leave') {
                try {
                    // Try Server first
                    const endpoint = status === 'approved' ? '/api/leave/approve' : '/api/leave/reject'
                    await ApiService.post(endpoint, {
                        leaveId: item.id,
                        employeeId: item.employeeId || item.uid,
                        mdId: currentUser.uid,
                        mdName: userProfile?.email || 'MD', // Safe fallback for undefined name
                        reason
                    });
                } catch (apiError) {
                    console.warn("API Error, falling back to direct DB write", apiError)

                    // Fallback: Direct DB Write
                    const leaveRef = ref(database, `leaves/${item.uid}/${item.id}`)

                    // Construct safe action data ensuring no undefined values
                    const actionDataEntry = {
                        by: currentUser.uid,
                        name: userProfile?.email || 'MD', // Fallback if name/email is missing
                        at: new Date().toISOString(),
                        reason: reason || '' // Ensure empty string instead of undefined
                    };

                    await update(leaveRef, {
                        status: status,
                        actionData: actionDataEntry
                    })
                }

            } else {
                // Attendance Logic (Client-Side) - NEW: Use nested path
                const updates = {
                    status: status,
                    actionTimestamp: Date.now(),
                    approvedAt: status === 'approved' ? new Date().toISOString() : null,
                    rejectedAt: status === 'rejected' ? new Date().toISOString() : null,
                    handledBy: userProfile?.email || 'MD',
                    mdReason: reason || null
                }
                if ((item.status === 'correction_pending' || item.isCorrection) && status === 'approved') {
                    updates.isCorrection = false
                }
                // NEW PATH: /employees/{uid}/attendance/{date}
                await update(ref(database, `employees/${item.employeeUid}/attendance/${item.date}`), updates)

                // Log Audit
                const auditRef = ref(database, 'audit')
                await push(auditRef, {
                    actor: userProfile?.email || 'MD',
                    action: status === 'approved' ? 'approveAttendance' : 'rejectAttendance',
                    target: { employeeId: item.employeeEmail, date: item.date },
                    details: { oldStatus: item.status, newStatus: status, reason },
                    timestamp: Date.now()
                })
            }
            if (status === 'approved') {
                showMessage('Approved', 'Request has been approved successfully.', 'success')
            } else {
                showMessage('Rejected', 'Request has been rejected.', 'info')
            }
        } catch (error) {
            console.error("Error updating status:", error)
            showMessage("Error", error.message || "Failed to update status. Please try again.", "error")
        } finally {
            setProcessingId(null)
            setRejectModal({ isOpen: false, item: null, reason: '' })
        }
    }

    const openRejectDialog = (item) => {
        setRejectModal({ isOpen: true, item, reason: '' })
    }

    const confirmReject = () => {
        const { item, reason } = rejectModal
        if (!item) return
        if (!reason.trim()) {
            alert("Please provide a reason for rejection")
            return
        }
        handleAction(item, 'rejected', reason)
    }

    const formatDate = (dateStr) => {
        try {
            return format(new Date(dateStr), 'do MMM yyyy')
        } catch {
            return dateStr
        }
    }

    return (
        <div className="approvals-container">
            <header className="approvals-header">
                <h1>Approvals</h1>
                <p>Manage pending requests</p>
            </header>

            <div className="approvals-list">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <span>Loading...</span>
                    </div>
                ) : approvals.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">✓</div>
                        <h3>All Caught Up!</h3>
                        <p>No pending approvals at the moment.</p>
                    </div>
                ) : (
                    approvals.map(item => {
                        const isLeave = item.reqType === 'leave'
                        const isCorrection = !isLeave && (item.status === 'correction_pending' || item.isCorrection)

                        return (
                            <div key={item.id} className={`approval-card ${isCorrection ? 'correction' : ''} ${isLeave ? 'leave-card' : ''}`}>
                                {isCorrection && <div className="correction-badge">📝 Correction Request</div>}
                                {isLeave && <div className="correction-badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>📅 Leave Request</div>}

                                <div className="approval-info">
                                    <div className="user-avatar">
                                        {(item.employeeName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="request-details">
                                        <h3>{item.employeeName || 'Unknown'}</h3>
                                        <div className="request-meta">
                                            {isLeave ? (
                                                <>
                                                    <span className="font-bold text-slate-700">{item.type}</span>
                                                    <span className="meta-dot">•</span>
                                                    <span>{formatDate(item.from)} - {formatDate(item.to)}</span>
                                                    <span className="meta-dot">•</span>
                                                    <span>{item.totalDays} Days</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="meta-date">{formatDate(item.date)}</span>
                                                    <span className="meta-dot">•</span>
                                                    <span className="meta-location">
                                                        {item.location === 'office' ? '🏢 Office' : '🏗️ Site'}
                                                        {item.siteName && ` - ${item.siteName}`}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {/* Correction Details */}
                                        {isCorrection && item.previousLocation && (
                                            <div className="correction-details">
                                                <span className="correction-from">
                                                    From: {item.previousLocation}{item.previousSiteName ? ` - ${item.previousSiteName}` : ''}
                                                </span>
                                                <span className="correction-arrow">→</span>
                                                <span className="correction-to">
                                                    To: {item.location}{item.siteName ? ` - ${item.siteName}` : ''}
                                                </span>
                                            </div>
                                        )}
                                        {/* Leave Reason */}
                                        {isLeave && item.reason && (
                                            <div className="text-sm text-slate-500 mt-1 italic">"{item.reason}"</div>
                                        )}
                                    </div>
                                </div>
                                <div className="approval-actions">
                                    <button
                                        className="action-btn reject-btn"
                                        onClick={() => openRejectDialog(item)}
                                        disabled={processingId === item.id}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        className="action-btn approve-btn"
                                        onClick={() => handleAction(item, 'approved')}
                                        disabled={processingId === item.id}
                                    >
                                        {processingId === item.id ? '...' : 'Approve'}
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* General Message Modal */}
            <RefinedModal
                isOpen={modalConfig.isOpen}
                onClose={closeMainModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />

            {/* Rejection Input Modal */}
            <RefinedModal
                isOpen={rejectModal.isOpen}
                onClose={() => setRejectModal({ ...rejectModal, isOpen: false })}
                title="Reject Request"
                message="Please provide a reason for rejecting this request."
                type="warning"
                primaryAction={{
                    label: 'Confirm Rejection',
                    onClick: confirmReject
                }}
                secondaryAction={{
                    label: 'Cancel',
                    onClick: () => setRejectModal({ ...rejectModal, isOpen: false })
                }}
            >
                <textarea
                    value={rejectModal.reason}
                    onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full mt-2 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                    rows={3}
                    placeholder="Enter rejection reason..."
                    autoFocus
                />
            </RefinedModal>
        </div>
    )
}

export default MDApprovals
