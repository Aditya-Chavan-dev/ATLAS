/**
 * DemoContext.jsx
 * 
 * SIMPLE EXPLANATION:
 * This is the "brain" of the demo that lets Employee and MD panels
 * talk to each other in real-time. When Employee marks attendance,
 * MD immediately sees it.
 * 
 * TECHNICAL DEPTH:
 * - Uses React Context + useReducer for predictable state management
 * - Provides shared demo state across all demo components
 * - Handles real-time sync between Employee and MD panels
 * - Manages demo session lifecycle (create, persist, reset)
 */

import { createContext, useContext, useReducer, useCallback } from 'react'

// Initial demo state
const initialDemoState = {
    // Session info
    sessionId: null,
    sourceId: null,
    deviceType: 'desktop',
    screenMode: 'split',

    // Demo data (isolated from production)
    attendance: null,           // Current attendance record
    notifications: [],          // In-app notifications
    pendingApproval: null,      // Request waiting for MD

    // Flow state
    currentStep: 0,             // Guided tour step
    completed: false,           // Demo completed flag

    // UI state
    activePanel: 'employee',    // For mobile tab view
    showTour: true,             // Show guided overlay
}

// Action types
const DEMO_ACTIONS = {
    INIT_SESSION: 'INIT_SESSION',
    MARK_ATTENDANCE: 'MARK_ATTENDANCE',
    ADD_NOTIFICATION: 'ADD_NOTIFICATION',
    CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
    SET_PENDING_APPROVAL: 'SET_PENDING_APPROVAL',
    APPROVE_ATTENDANCE: 'APPROVE_ATTENDANCE',
    REJECT_ATTENDANCE: 'REJECT_ATTENDANCE',
    ADVANCE_STEP: 'ADVANCE_STEP',
    SET_ACTIVE_PANEL: 'SET_ACTIVE_PANEL',
    TOGGLE_TOUR: 'TOGGLE_TOUR',
    RESET_DEMO: 'RESET_DEMO',
    SET_COMPLETED: 'SET_COMPLETED',
}

// Reducer for demo state
function demoReducer(state, action) {
    switch (action.type) {
        case DEMO_ACTIONS.INIT_SESSION:
            return {
                ...state,
                sessionId: action.payload.sessionId,
                sourceId: action.payload.sourceId,
                deviceType: action.payload.deviceType,
                screenMode: action.payload.screenMode,
            }

        case DEMO_ACTIONS.MARK_ATTENDANCE:
            return {
                ...state,
                attendance: {
                    status: action.payload.status,
                    siteName: action.payload.siteName || '',
                    timestamp: action.payload.timestamp,
                    approvalStatus: 'pending',
                },
                pendingApproval: {
                    status: action.payload.status,
                    siteName: action.payload.siteName || '',
                    timestamp: action.payload.timestamp,
                    employeeName: 'Demo Employee',
                },
            }

        case DEMO_ACTIONS.ADD_NOTIFICATION:
            return {
                ...state,
                notifications: [
                    {
                        id: Date.now(),
                        type: action.payload.type,
                        message: action.payload.message,
                        timestamp: action.payload.timestamp || new Date().toISOString(),
                        read: false,
                    },
                    ...state.notifications,
                ],
            }

        case DEMO_ACTIONS.CLEAR_NOTIFICATIONS:
            return {
                ...state,
                notifications: [],
            }

        case DEMO_ACTIONS.SET_PENDING_APPROVAL:
            return {
                ...state,
                pendingApproval: action.payload,
            }

        case DEMO_ACTIONS.APPROVE_ATTENDANCE:
            return {
                ...state,
                attendance: state.attendance ? {
                    ...state.attendance,
                    approvalStatus: 'approved',
                } : null,
                pendingApproval: null,
            }

        case DEMO_ACTIONS.REJECT_ATTENDANCE:
            return {
                ...state,
                attendance: state.attendance ? {
                    ...state.attendance,
                    approvalStatus: 'rejected',
                    rejectionReason: action.payload.reason,
                } : null,
                pendingApproval: null,
            }

        case DEMO_ACTIONS.ADVANCE_STEP:
            return {
                ...state,
                currentStep: action.payload.step,
            }

        case DEMO_ACTIONS.SET_ACTIVE_PANEL:
            return {
                ...state,
                activePanel: action.payload.panel,
            }

        case DEMO_ACTIONS.TOGGLE_TOUR:
            return {
                ...state,
                showTour: action.payload.show,
            }

        case DEMO_ACTIONS.SET_COMPLETED:
            return {
                ...state,
                completed: true,
            }

        case DEMO_ACTIONS.RESET_DEMO:
            return {
                ...initialDemoState,
                sessionId: state.sessionId,
                sourceId: state.sourceId,
                deviceType: state.deviceType,
                screenMode: state.screenMode,
                showTour: state.showTour, // Preserve tour visibility
                completed: state.completed, // Preserve completed status
            }

        default:
            return state
    }
}

// Create context
const DemoContext = createContext(null)

// Custom hook to use demo context
export function useDemoContext() {
    const context = useContext(DemoContext)
    if (!context) {
        throw new Error('useDemoContext must be used within DemoProvider')
    }
    return context
}

// Demo Provider Component
export function DemoProvider({ children }) {
    const [state, dispatch] = useReducer(demoReducer, initialDemoState)

    // Action creators
    const initSession = useCallback((sessionId, sourceId, deviceType, screenMode) => {
        dispatch({
            type: DEMO_ACTIONS.INIT_SESSION,
            payload: { sessionId, sourceId, deviceType, screenMode },
        })
    }, [])

    const markAttendance = useCallback((status, siteName = '') => {
        const timestamp = new Date().toISOString()
        dispatch({
            type: DEMO_ACTIONS.MARK_ATTENDANCE,
            payload: { status, siteName, timestamp },
        })
        // Also add notification for employee
        dispatch({
            type: DEMO_ACTIONS.ADD_NOTIFICATION,
            payload: {
                type: 'attendance_marked',
                message: `Attendance marked as ${status}${siteName ? ` - ${siteName}` : ''}. Waiting for approval.`,
                timestamp,
            },
        })
    }, [])

    const addNotification = useCallback((type, message) => {
        dispatch({
            type: DEMO_ACTIONS.ADD_NOTIFICATION,
            payload: { type, message, timestamp: new Date().toISOString() },
        })
    }, [])

    const clearNotifications = useCallback(() => {
        dispatch({ type: DEMO_ACTIONS.CLEAR_NOTIFICATIONS })
    }, [])

    const approveAttendance = useCallback(() => {
        dispatch({ type: DEMO_ACTIONS.APPROVE_ATTENDANCE })
        // Add confirmation notification
        dispatch({
            type: DEMO_ACTIONS.ADD_NOTIFICATION,
            payload: {
                type: 'attendance_approved',
                message: 'Your attendance has been approved by MD.',
                timestamp: new Date().toISOString(),
            },
        })
    }, [])

    const rejectAttendance = useCallback((reason) => {
        dispatch({
            type: DEMO_ACTIONS.REJECT_ATTENDANCE,
            payload: { reason },
        })
        dispatch({
            type: DEMO_ACTIONS.ADD_NOTIFICATION,
            payload: {
                type: 'attendance_rejected',
                message: `Your attendance was rejected. Reason: ${reason}`,
                timestamp: new Date().toISOString(),
            },
        })
    }, [])

    const advanceStep = useCallback((step) => {
        dispatch({
            type: DEMO_ACTIONS.ADVANCE_STEP,
            payload: { step },
        })
    }, [])

    const setActivePanel = useCallback((panel) => {
        dispatch({
            type: DEMO_ACTIONS.SET_ACTIVE_PANEL,
            payload: { panel },
        })
    }, [])

    const toggleTour = useCallback((show) => {
        dispatch({
            type: DEMO_ACTIONS.TOGGLE_TOUR,
            payload: { show },
        })
    }, [])

    const setCompleted = useCallback(() => {
        dispatch({ type: DEMO_ACTIONS.SET_COMPLETED })
    }, [])

    const resetDemo = useCallback(() => {
        dispatch({ type: DEMO_ACTIONS.RESET_DEMO })
    }, [])

    const value = {
        // State
        ...state,

        // Actions
        initSession,
        markAttendance,
        addNotification,
        clearNotifications,
        approveAttendance,
        rejectAttendance,
        advanceStep,
        setActivePanel,
        toggleTour,
        setCompleted,
        resetDemo,
    }

    return (
        <DemoContext.Provider value={value}>
            {children}
        </DemoContext.Provider>
    )
}

export { DEMO_ACTIONS }
export default DemoContext
