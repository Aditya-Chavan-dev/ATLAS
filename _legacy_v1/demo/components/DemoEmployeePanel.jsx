/**
 * DemoEmployeePanel.jsx
 * 
 * SIMPLE EXPLANATION:
 * This is the Employee side of the demo. It shows a simplified version
 * of the employee attendance marking interface. When you click "Mark Attendance",
 * it updates the shared demo state so the MD panel can see it.
 * 
 * TECHNICAL DEPTH:
 * - Simplified version of production EmployeeHome
 * - Uses DemoContext for cross-panel communication
 * - Triggers useDemoMetrics events on actions
 * - Shows attendance status and confirmation
 */

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useDemoContext } from '../context/DemoContext'
import { useDemoMetrics } from '../hooks/useDemoMetrics'

function DemoEmployeePanel() {
    const {
        attendance,
        notifications,
        markAttendance,
        currentStep,
        advanceStep,
        setActivePanel,
    } = useDemoContext()

    const { logMarkAttendance } = useDemoMetrics()

    const [showOptions, setShowOptions] = useState(false)
    const [siteName, setSiteName] = useState('')
    const [isMarking, setIsMarking] = useState(false)

    const today = new Date()
    const formattedDate = format(today, 'EEEE, do MMMM yyyy')
    const formattedTime = format(today, 'h:mm a')

    // Check if mobile
    const isMobile = () => window.innerWidth < 1024

    // Auto-advance tour when notifications appear (step 1 → 2)
    useEffect(() => {
        if (notifications.length > 0 && currentStep === 1) {
            // Small delay to let user see the notification first
            const timer = setTimeout(() => {
                advanceStep(2)
                // Auto-switch to MD view on mobile to show pending approval
                if (isMobile()) {
                    setActivePanel('md')
                }
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [notifications.length, currentStep, advanceStep, setActivePanel])

    // Handle marking attendance
    const handleMarkAttendance = async (status) => {
        setIsMarking(true)

        // Simulate a brief delay for realism
        await new Promise(resolve => setTimeout(resolve, 500))

        // Update demo state (triggers notification to MD)
        markAttendance(status, status === 'site' ? siteName : '')

        // Log metric event (privacy-first: only event type + timestamp)
        logMarkAttendance()

        // Advance tour step
        if (currentStep === 0) {
            advanceStep(1)
        }

        setIsMarking(false)
        setShowOptions(false)
        setSiteName('')
    }

    // Get status display
    const getStatusDisplay = () => {
        if (!attendance) return null

        const statusConfig = {
            office: { label: 'Office', color: '#10b981', icon: '🏢' },
            wfh: { label: 'Work From Home', color: '#3b82f6', icon: '🏠' },
            site: { label: `Site - ${attendance.siteName}`, color: '#8b5cf6', icon: '📍' },
        }

        const config = statusConfig[attendance.status] || { label: attendance.status, color: '#6b7280', icon: '📋' }

        return (
            <div className="demo-employee-status-display" style={{ borderColor: config.color }}>
                <div className="status-icon" style={{ backgroundColor: `${config.color}15` }}>
                    <span>{config.icon}</span>
                </div>
                <div className="status-details">
                    <div className="status-label">{config.label}</div>
                    <div className="status-time">Marked at {format(new Date(attendance.timestamp), 'h:mm a')}</div>
                    <div className={`approval-badge ${attendance.approvalStatus}`}>
                        {attendance.approvalStatus === 'pending' && '⏳ Pending Approval'}
                        {attendance.approvalStatus === 'approved' && '✅ Approved'}
                        {attendance.approvalStatus === 'rejected' && '❌ Rejected'}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="demo-employee-panel">
            {/* Welcome Card */}
            <div className="demo-card welcome-card">
                <div className="welcome-header">
                    <div className="welcome-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <div className="welcome-text">
                        <h2>Good Morning, Demo Employee</h2>
                        <p>{formattedDate}</p>
                    </div>
                </div>
            </div>

            {/* Attendance Card */}
            <div className="demo-card attendance-card" data-tour-step="0">
                <div className="card-header">
                    <h3>Today's Attendance</h3>
                    <span className="current-time">{formattedTime}</span>
                </div>

                {attendance ? (
                    // Show marked status
                    getStatusDisplay()
                ) : (
                    // Show marking options
                    <div className="attendance-actions">
                        {!showOptions ? (
                            <button
                                className="demo-primary-button"
                                onClick={() => setShowOptions(true)}
                                disabled={isMarking}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                Mark Attendance
                            </button>
                        ) : (
                            <div className="attendance-options">
                                <p className="options-label">Select your work location:</p>
                                <div className="options-grid">
                                    <button
                                        className="option-button office"
                                        onClick={() => handleMarkAttendance('office')}
                                        disabled={isMarking}
                                    >
                                        <span className="option-icon">🏢</span>
                                        <span>Office</span>
                                    </button>
                                    <button
                                        className="option-button wfh"
                                        onClick={() => handleMarkAttendance('wfh')}
                                        disabled={isMarking}
                                    >
                                        <span className="option-icon">🏠</span>
                                        <span>WFH</span>
                                    </button>
                                </div>
                                <div className="site-option">
                                    <input
                                        type="text"
                                        placeholder="Enter site name..."
                                        value={siteName}
                                        onChange={(e) => setSiteName(e.target.value)}
                                        className="site-input"
                                    />
                                    <button
                                        className="option-button site"
                                        onClick={() => handleMarkAttendance('site')}
                                        disabled={isMarking || !siteName.trim()}
                                    >
                                        <span className="option-icon">📍</span>
                                        <span>Site</span>
                                    </button>
                                </div>
                                <button
                                    className="cancel-button"
                                    onClick={() => setShowOptions(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Recent Notifications */}
            <div className="demo-card notifications-card" data-tour-step="1">
                <div className="card-header">
                    <h3>Recent Activity</h3>
                    {notifications.length > 0 && (
                        <span className="notification-count">{notifications.length}</span>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <p>No activity yet</p>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications.slice(0, 3).map((notif) => (
                            <div key={notif.id} className={`notification-item ${notif.type}`}>
                                <div className="notification-icon">
                                    {notif.type === 'attendance_marked' && '📋'}
                                    {notif.type === 'attendance_approved' && '✅'}
                                    {notif.type === 'attendance_rejected' && '❌'}
                                </div>
                                <div className="notification-content">
                                    <p>{notif.message}</p>
                                    <span className="notification-time">
                                        {format(new Date(notif.timestamp), 'h:mm a')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DemoEmployeePanel
