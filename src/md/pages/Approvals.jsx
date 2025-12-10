import { useState, useEffect } from 'react'
import { ref, onValue, update, push } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import './Approvals.css'

function MDApprovals() {
    const { userProfile, currentUser } = useAuth()
    const [approvals, setApprovals] = useState([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState(null)

    useEffect(() => {
        const attendanceRef = ref(database, 'attendance')
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const allItems = Object.entries(data)
                    .map(([id, item]) => ({ id, ...item }))
                    .filter(item =>
                        item.status === 'pending' ||
                        item.status === 'correction_pending' ||
                        item.status === 'edit_pending'
                    )
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

                setApprovals(allItems)
            } else {
                setApprovals([])
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const logAudit = async (action, target, details) => {
        try {
            const auditRef = ref(database, 'audit')
            await push(auditRef, {
                actor: userProfile?.email || 'MD',
                action,
                target,
                details,
                timestamp: Date.now()
            })
        } catch (error) {
            console.error("Audit log failed:", error)
        }
    }

    const createNotification = async (userId, type, title, message) => {
        try {
            const notificationRef = ref(database, `notifications/${userId}`)
            await push(notificationRef, {
                type,
                title,
                message,
                read: false,
                timestamp: new Date().toISOString()
            })
        } catch (error) {
            console.error("Notification creation failed:", error)
        }
    }

    const handleAction = async (item, status, reason = '') => {
        setProcessingId(item.id)
        try {
            const updates = {
                status: status,
                actionTimestamp: Date.now(),
                approvedAt: status === 'approved' ? new Date().toISOString() : null,
                rejectedAt: status === 'rejected' ? new Date().toISOString() : null,
                handledBy: userProfile?.email || 'MD',
                mdReason: reason || null
            }

            // If this is a correction request being approved, clear the correction flag
            if ((item.status === 'correction_pending' || item.isCorrection) && status === 'approved') {
                updates.isCorrection = false
            }

            console.log('Approving item:', item.id, 'with updates:', updates)

            // Update attendance record
            await update(ref(database, `attendance/${item.id}`), updates)

            // Create notification for employee
            const notificationType = status === 'approved' ? 'approval' : 'rejection'
            const notificationTitle = status === 'approved' ? '✅ Attendance Approved' : '❌ Attendance Rejected'
            const notificationMessage = status === 'approved'
                ? `Your attendance for ${item.date} has been approved.`
                : `Your attendance for ${item.date} was rejected.${reason ? ` Reason: ${reason}` : ''}`

            if (item.employeeId) {
                await createNotification(item.employeeId, notificationType, notificationTitle, notificationMessage)
            }

            // Log Audit
            await logAudit(
                status === 'approved' ? 'approveAttendance' : 'rejectAttendance',
                { employeeId: item.employeeEmail, date: item.date },
                { oldStatus: item.status, newStatus: status, reason }
            )

        } catch (error) {
            console.error("Error updating status:", error)
            alert("Failed to update status. Please try again.")
        } finally {
            setProcessingId(null)
        }
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
                <p>Manage pending attendance requests</p>
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
                        const isCorrection = item.status === 'correction_pending' || item.isCorrection
                        return (
                            <div key={item.id} className={`approval-card ${isCorrection ? 'correction' : ''}`}>
                                {isCorrection && (
                                    <div className="correction-badge">📝 Correction Request</div>
                                )}
                                <div className="approval-info">
                                    <div className="user-avatar">
                                        {(item.employeeName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="request-details">
                                        <h3>{item.employeeName || 'Unknown'}</h3>
                                        <div className="request-meta">
                                            <span className="meta-date">{formatDate(item.date)}</span>
                                            <span className="meta-dot">•</span>
                                            <span className="meta-location">
                                                {item.location === 'office' ? '🏢 Office' : '🏗️ Site'}
                                                {item.siteName && ` - ${item.siteName}`}
                                            </span>
                                        </div>
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
                                    </div>
                                </div>
                                <div className="approval-actions">
                                    <button
                                        className="action-btn reject-btn"
                                        onClick={() => {
                                            const reason = prompt("Reason for rejection (optional):")
                                            if (reason !== null) handleAction(item, 'rejected', reason)
                                        }}
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
        </div>
    )
}

export default MDApprovals
