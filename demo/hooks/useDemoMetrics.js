/**
 * useDemoMetrics.js
 * 
 * SIMPLE EXPLANATION:
 * This hook captures demo events and analytics while respecting privacy.
 * It tracks: event types, timestamps, step progress, duration, and device type.
 * NO personal information, NO IP addresses, NO fingerprinting.
 * 
 * TECHNICAL DEPTH:
 * - Captures: event type, timestamp, step reached, duration, device category
 * - Privacy by design: no PII, only aggregatable data
 * - Events logged to /demo/sessions/{sessionId}/
 * - Uses Firebase serverTimestamp for consistency
 * 
 * ENHANCED FEATURES:
 * - Session timing (duration, step times)
 * - Drop-off tracking (last step on exit)
 * - Device category (mobile/tablet/desktop)
 * - Browser category (Chrome/Safari/Firefox/Other)
 */

import { useCallback, useRef, useEffect } from 'react'
import { ref, set, update, serverTimestamp, get } from 'firebase/database'
import { database } from '../../src/firebase/config'

// Allowed event types (strict whitelist)
const ALLOWED_EVENTS = {
    VISIT: 'VISIT',
    MARK_ATTENDANCE: 'MARK_ATTENDANCE',
    MD_NOTIFICATION_RECEIVED: 'MD_NOTIFICATION_RECEIVED',
    MD_APPROVED: 'MD_APPROVED',
    MD_REJECTED: 'MD_REJECTED',
    DEMO_RESET: 'DEMO_RESET',
    DEMO_COMPLETED: 'DEMO_COMPLETED',
    STEP_REACHED: 'STEP_REACHED',
    EXIT: 'EXIT',
}

// Get device category (privacy-safe, no fingerprinting)
function getDeviceCategory() {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
}

// Get browser category (privacy-safe, broad categories only)
function getBrowserCategory() {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome'
    if (ua.includes('safari') && !ua.includes('chrome')) return 'safari'
    if (ua.includes('firefox')) return 'firefox'
    if (ua.includes('edg')) return 'edge'
    return 'other'
}

// Get OS category (privacy-safe)
function getOSCategory() {
    const platform = navigator.platform?.toLowerCase() || ''
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('android')) return 'android'
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios'
    if (platform.includes('win')) return 'windows'
    if (platform.includes('mac')) return 'macos'
    if (platform.includes('linux')) return 'linux'
    return 'other'
}

export function useDemoMetrics() {
    const sessionStartTime = useRef(Date.now())
    const lastStepTime = useRef(Date.now())
    const currentStep = useRef(0)
    const hasLoggedExit = useRef(false)

    /**
     * Log a demo event with optional metadata
     */
    const logEvent = useCallback(async (eventType, metadata = {}) => {
        try {
            // Validate event type
            if (!ALLOWED_EVENTS[eventType]) {
                console.warn(`Invalid demo event type: ${eventType}`)
                return
            }

            // Get session ID from storage
            const sessionId = sessionStorage.getItem('demo_session_id')

            if (!sessionId) {
                console.warn('No demo session found, cannot log event')
                return
            }

            // Log to Firebase with timestamp and optional clean metadata
            const eventRef = ref(database, `demo/sessions/${sessionId}/events/${eventType}`)
            await set(eventRef, {
                timestamp: serverTimestamp(),
                ...metadata
            })

            console.log(`📊 Demo event logged: ${eventType}`, metadata)

        } catch (err) {
            // Fail silently - metrics should never break the demo
            console.error('Error logging demo event:', err)
        }
    }, [])

    /**
     * Update session analytics
     */
    const updateSessionAnalytics = useCallback(async (analyticsData) => {
        try {
            const sessionId = sessionStorage.getItem('demo_session_id')
            if (!sessionId) return

            const sessionRef = ref(database, `demo/sessions/${sessionId}`)
            await update(sessionRef, analyticsData)
        } catch (err) {
            console.error('Error updating session analytics:', err)
        }
    }, [])

    /**
     * Track step progression with timing
     */
    const trackStepReached = useCallback(async (step) => {
        const now = Date.now()
        const stepDuration = now - lastStepTime.current
        lastStepTime.current = now
        currentStep.current = step

        // Update session with step info
        await updateSessionAnalytics({
            lastStep: step,
            [`stepTimes/step${step}`]: stepDuration,
            lastActivity: serverTimestamp()
        })

        // Log step event
        await logEvent(ALLOWED_EVENTS.STEP_REACHED, { step })
    }, [logEvent, updateSessionAnalytics])

    /**
     * Track session exit (for drop-off analysis)
     */
    const trackExit = useCallback(async () => {
        if (hasLoggedExit.current) return
        hasLoggedExit.current = true

        const sessionDuration = Date.now() - sessionStartTime.current

        await updateSessionAnalytics({
            exitStep: currentStep.current,
            sessionDuration,
            endedAt: serverTimestamp()
        })

        await logEvent(ALLOWED_EVENTS.EXIT, {
            step: currentStep.current,
            duration: sessionDuration
        })
    }, [logEvent, updateSessionAnalytics])

    /**
     * Initialize session with device info
     */
    const initSessionAnalytics = useCallback(async () => {
        const deviceInfo = {
            deviceCategory: getDeviceCategory(),
            browserCategory: getBrowserCategory(),
            osCategory: getOSCategory(),
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            startedAt: serverTimestamp()
        }

        await updateSessionAnalytics(deviceInfo)
        console.log('📊 Session analytics initialized:', deviceInfo)
    }, [updateSessionAnalytics])

    // Set up exit tracking
    useEffect(() => {
        const handleBeforeUnload = () => {
            trackExit()
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                trackExit()
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [trackExit])

    // Convenience methods for each event type
    const logVisit = useCallback(async () => {
        await initSessionAnalytics()
        await logEvent(ALLOWED_EVENTS.VISIT)
    }, [logEvent, initSessionAnalytics])

    const logMarkAttendance = useCallback(() => logEvent(ALLOWED_EVENTS.MARK_ATTENDANCE), [logEvent])
    const logMDNotificationReceived = useCallback(() => logEvent(ALLOWED_EVENTS.MD_NOTIFICATION_RECEIVED), [logEvent])
    const logMDApproved = useCallback(() => logEvent(ALLOWED_EVENTS.MD_APPROVED), [logEvent])
    const logMDRejected = useCallback(() => logEvent(ALLOWED_EVENTS.MD_REJECTED), [logEvent])
    const logDemoReset = useCallback(() => logEvent(ALLOWED_EVENTS.DEMO_RESET), [logEvent])

    const logDemoCompleted = useCallback(async () => {
        const sessionDuration = Date.now() - sessionStartTime.current

        await updateSessionAnalytics({
            completed: true,
            sessionDuration,
            completedAt: serverTimestamp()
        })

        await logEvent(ALLOWED_EVENTS.DEMO_COMPLETED, {
            duration: sessionDuration,
            stepsCompleted: currentStep.current
        })
    }, [logEvent, updateSessionAnalytics])

    return {
        logEvent,
        logVisit,
        logMarkAttendance,
        logMDNotificationReceived,
        logMDApproved,
        logMDRejected,
        logDemoReset,
        logDemoCompleted,
        trackStepReached,
        trackExit,
        ALLOWED_EVENTS,
    }
}

export { ALLOWED_EVENTS }
export default useDemoMetrics
