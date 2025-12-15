/**
 * DemoMDPanel.jsx
 * 
 * SIMPLE EXPLANATION:
 * This is the MD (Managing Director) side of the demo. It shows pending
 * attendance requests and lets you approve or reject them. When Employee
 * marks attendance, it appears here in real-time.
 * 
 * TECHNICAL DEPTH:
 * - Simplified version of production MDApprovals
 * - Listens to DemoContext for pending approvals
 * - Triggers useDemoMetrics events on approval/rejection
 * - Shows confirmation after action
 */

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useDemoContext } from '../context/DemoContext'
import { useDemoMetrics } from '../hooks/useDemoMetrics'

function DemoMDPanel() {
    const {
        pendingApproval,
        attendance,
        approveAttendance,
        rejectAttendance,
        addNotification,
        currentStep,
        advanceStep,
        setActivePanel,
    } = useDemoContext()

    const { logMDNotificationReceived, logMDApproved, logMDRejected } = useDemoMetrics()

    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [hasLoggedNotification, setHasLoggedNotification] = useState(false)

    // Check if mobile
    const isMobile = () => window.innerWidth < 1024

    // Log when MD receives notification (once per pending approval)
    useEffect(() => {
        if (pendingApproval && !hasLoggedNotification) {
            logMDNotificationReceived()
            setHasLoggedNotification(true)

            // Advance tour step
            // Step 1 = "Notification sent", Step 2 = "MD receives request"
            // When we see pending approval, we advance to step 3 "Approve the request"
            if (currentStep === 2) {
                advanceStep(3)
            }
        }

        if (!pendingApproval) {
            setHasLoggedNotification(false)
        }
    }, [pendingApproval, hasLoggedNotification, logMDNotificationReceived, currentStep, advanceStep])

    // Handle approval
    const handleApprove = async () => {
        setIsProcessing(true)

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500))

        // Update demo state
        approveAttendance()

        // Log metric
        logMDApproved()

        // Advance tour step to final step (Demo Complete)
        // Check for both step 2 and 3 to handle race condition with auto-advance
        // Step 2 = "MD receives request", Step 3 = "Approve the request", Step 4 = "Demo Complete"
        if (currentStep >= 2 && currentStep <= 3) {
            advanceStep(4)
        }

        // Auto-switch back to Employee view on mobile to show result
        if (isMobile()) {
            setTimeout(() => setActivePanel('employee'), 1000)
        }

        setIsProcessing(false)
    }

    // Handle rejection
    const handleReject = async () => {
        if (!rejectReason.trim()) return

        setIsProcessing(true)

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500))

        // Update demo state
        rejectAttendance(rejectReason)

        // Log metric
        logMDRejected()

        // Auto-switch back to Employee view on mobile to show result
        if (isMobile()) {
            setTimeout(() => setActivePanel('employee'), 1000)
        }

        setIsProcessing(false)
        setShowRejectModal(false)
        setRejectReason('')
    }

    // Get status config for display
    const getStatusConfig = (status) => {
        const configs = {
            office: { label: 'Office', color: '#10b981', icon: '🏢' },
            wfh: { label: 'Work From Home', color: '#3b82f6', icon: '🏠' },
            site: { label: 'Site', color: '#8b5cf6', icon: '📍' },
        }
        return configs[status] || { label: status, color: '#6b7280', icon: '📋' }
    }

    return (
        <div className="demo-md-panel">
            {/* Dashboard Stats Card */}
            <div className="demo-card stats-card">
                <div className="card-header">
                    <h3>Dashboard Overview</h3>
                    <span className="today-date">{format(new Date(), 'do MMM yyyy')}</span>
                </div>
                <div className="stats-grid">
                    <div className="stat-item">
                        <div className="stat-value">{pendingApproval ? 1 : 0}</div>
                        <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">
                            {attendance?.approvalStatus === 'approved' ? 1 : 0}
                        </div>
                        <div className="stat-label">Approved</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">
                            {attendance?.approvalStatus === 'rejected' ? 1 : 0}
                        </div>
                        <div className="stat-label">Rejected</div>
                    </div>
                </div>
            </div>

            {/* Pending Approvals Card */}
            <div className="demo-card approvals-card" data-tour-step="2">
                <div className="card-header">
                    <h3>Pending Approvals</h3>
                    {pendingApproval && <span className="pending-badge">1 New</span>}
                </div>

                {pendingApproval ? (
                    <div className="approval-item">
                        <div className="approval-header">
                            <div className="employee-info">
                                <div className="employee-avatar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <div className="employee-details">
                                    <h4>{pendingApproval.employeeName}</h4>
                                    <p>Attendance Request</p>
                                </div>
                            </div>
                            <span className="request-time">
                                {format(new Date(pendingApproval.timestamp), 'h:mm a')}
                            </span>
                        </div>

                        <div className="approval-content">
                            <div
                                className="status-badge"
                                style={{
                                    backgroundColor: `${getStatusConfig(pendingApproval.status).color}15`,
                                    color: getStatusConfig(pendingApproval.status).color,
                                }}
                            >
                                <span>{getStatusConfig(pendingApproval.status).icon}</span>
                                <span>
                                    {getStatusConfig(pendingApproval.status).label}
                                    {pendingApproval.siteName && ` - ${pendingApproval.siteName}`}
                                </span>
                            </div>
                        </div>

                        <div className="approval-actions" data-tour-step="3">
                            <button
                                className="approve-button"
                                onClick={handleApprove}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <span className="spinner" />
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Approve
                                    </>
                                )}
                            </button>
                            <button
                                className="reject-button"
                                onClick={() => setShowRejectModal(true)}
                                disabled={isProcessing}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Reject
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="empty-state">
                        {attendance?.approvalStatus === 'approved' ? (
                            <>
                                <div className="success-icon">✅</div>
                                <p>All caught up!</p>
                                <span>Request was approved successfully</span>
                            </>
                        ) : attendance?.approvalStatus === 'rejected' ? (
                            <>
                                <div className="rejected-icon">❌</div>
                                <p>Request rejected</p>
                                <span>The employee has been notified</span>
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>No pending requests</p>
                                <span>Waiting for employee to mark attendance...</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Rejection Reason Modal */}
            {showRejectModal && (
                <div className="demo-modal-overlay">
                    <div className="demo-modal">
                        <div className="modal-header">
                            <h3>Reject Attendance</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowRejectModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <label>Please provide a reason for rejection:</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                rows={3}
                            />
                        </div>
                        <div className="modal-footer">
                            <button
                                className="modal-cancel"
                                onClick={() => setShowRejectModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-confirm"
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || isProcessing}
                            >
                                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DemoMDPanel
