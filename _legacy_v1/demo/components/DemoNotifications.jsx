/**
 * DemoNotifications.jsx
 * 
 * SIMPLE EXPLANATION:
 * This shows floating toast notifications that appear when things happen
 * in the demo (like attendance marked or approved). Same concept as
 * push notifications but shown in-app only.
 * 
 * TECHNICAL DEPTH:
 * - Uses same notification abstraction as production
 * - Demo mode: In-app toasts only (no push notifications)
 * - Shows: event type, timestamp, status change
 * - Auto-dismisses after 5 seconds
 */

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useDemoContext } from '../context/DemoContext'

function DemoNotifications() {
    const { notifications } = useDemoContext()
    const [visibleNotifications, setVisibleNotifications] = useState([])

    // Track which notifications have been shown
    useEffect(() => {
        const newNotifications = notifications.filter(
            n => !visibleNotifications.find(v => v.id === n.id)
        )

        if (newNotifications.length > 0) {
            // Add new notifications with animation state
            setVisibleNotifications(prev => [
                ...newNotifications.map(n => ({ ...n, visible: true })),
                ...prev,
            ])

            // Auto-dismiss after 5 seconds
            newNotifications.forEach(n => {
                setTimeout(() => {
                    setVisibleNotifications(prev =>
                        prev.map(v =>
                            v.id === n.id ? { ...v, visible: false } : v
                        )
                    )

                    // Remove from DOM after animation
                    setTimeout(() => {
                        setVisibleNotifications(prev =>
                            prev.filter(v => v.id !== n.id)
                        )
                    }, 300)
                }, 5000)
            })
        }
    }, [notifications])

    // Get icon for notification type
    const getIcon = (type) => {
        switch (type) {
            case 'attendance_marked':
                return '📋'
            case 'attendance_approved':
                return '✅'
            case 'attendance_rejected':
                return '❌'
            default:
                return '🔔'
        }
    }

    // Get color for notification type
    const getColor = (type) => {
        switch (type) {
            case 'attendance_marked':
                return '#f59e0b'
            case 'attendance_approved':
                return '#10b981'
            case 'attendance_rejected':
                return '#ef4444'
            default:
                return '#6366f1'
        }
    }

    if (visibleNotifications.length === 0) return null

    return (
        <div className="demo-notifications-container">
            {visibleNotifications.map(notif => (
                <div
                    key={notif.id}
                    className={`demo-notification-toast ${notif.visible ? 'show' : 'hide'}`}
                    style={{ borderLeftColor: getColor(notif.type) }}
                >
                    <div className="toast-icon">
                        {getIcon(notif.type)}
                    </div>
                    <div className="toast-content">
                        <p className="toast-message">{notif.message}</p>
                        <span className="toast-time">
                            {format(new Date(notif.timestamp), 'h:mm:ss a')}
                        </span>
                    </div>
                    <button
                        className="toast-close"
                        onClick={() => {
                            setVisibleNotifications(prev =>
                                prev.filter(v => v.id !== notif.id)
                            )
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    )
}

export default DemoNotifications
