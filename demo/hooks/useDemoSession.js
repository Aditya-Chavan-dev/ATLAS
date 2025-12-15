/**
 * useDemoSession.js
 * 
 * SIMPLE EXPLANATION:
 * This hook handles creating a demo session when someone visits the page.
 * It reads the source ID from the URL, validates it exists, and creates
 * a session record in Firebase. The session persists until the browser closes.
 * 
 * TECHNICAL DEPTH:
 * - Extracts sourceId from URL query param (?s=xxx)
 * - Validates source exists in /demo/sources/
 * - Creates session in /demo/sessions/{sessionId}
 * - Detects device type and screen mode
 * - Handles session persistence via sessionStorage
 * - Provides reset functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { ref, get, set, serverTimestamp } from 'firebase/database'
import { database } from '../../src/firebase/config'
import { useDemoContext } from '../context/DemoContext'

// Generate a unique session ID
function generateSessionId() {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `demo_${timestamp}_${random}`
}

// Detect device type
function detectDeviceType() {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
}

// Detect screen mode based on device
function detectScreenMode() {
    const width = window.innerWidth
    return width >= 1024 ? 'split' : 'tab'
}

export function useDemoSession() {
    const { initSession, resetDemo } = useDemoContext()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [sessionData, setSessionData] = useState(null)

    // Initialize session on mount
    useEffect(() => {
        async function initializeDemoSession() {
            try {
                setLoading(true)
                setError(null)

                // Check for existing session in sessionStorage
                const existingSessionId = sessionStorage.getItem('demo_session_id')

                if (existingSessionId) {
                    // Restore existing session
                    const sessionRef = ref(database, `demo/sessions/${existingSessionId}`)
                    const snapshot = await get(sessionRef)

                    if (snapshot.exists()) {
                        const data = snapshot.val()
                        setSessionData(data)
                        initSession(
                            existingSessionId,
                            data.sourceId,
                            data.deviceType,
                            data.screenMode
                        )
                        setLoading(false)
                        return
                    }
                }

                // Get sourceId from URL
                const urlParams = new URLSearchParams(window.location.search)
                let sourceId = urlParams.get('s') || 'direct'

                // Validate source exists (if not 'direct')
                if (sourceId !== 'direct') {
                    const sourceRef = ref(database, `demo/sources/${sourceId}`)
                    const sourceSnapshot = await get(sourceRef)

                    if (!sourceSnapshot.exists()) {
                        console.warn(`Source ${sourceId} not found, using 'direct'`)
                        sourceId = 'direct'
                    }
                }

                // Create new session
                const sessionId = generateSessionId()
                const deviceType = detectDeviceType()
                const screenMode = detectScreenMode()

                const newSession = {
                    sessionId,
                    sourceId,
                    startedAt: serverTimestamp(),
                    deviceType,
                    screenMode,
                    completed: false,
                }

                // Save to Firebase
                const sessionRef = ref(database, `demo/sessions/${sessionId}`)
                await set(sessionRef, newSession)

                // Save to sessionStorage for persistence
                sessionStorage.setItem('demo_session_id', sessionId)

                // Update context
                setSessionData(newSession)
                initSession(sessionId, sourceId, deviceType, screenMode)

                setLoading(false)

            } catch (err) {
                console.error('Error initializing demo session:', err)
                setError('Failed to initialize demo session')
                setLoading(false)
            }
        }

        initializeDemoSession()
    }, [initSession])

    // Reset session (for "Reset Demo" button)
    const resetSession = useCallback(async () => {
        try {
            const sessionId = sessionStorage.getItem('demo_session_id')

            if (sessionId) {
                // Log reset event
                const eventRef = ref(database, `demo/sessions/${sessionId}/events/DEMO_RESET`)
                await set(eventRef, serverTimestamp())
            }

            // Clear session from storage
            sessionStorage.removeItem('demo_session_id')

            // Reset context state
            resetDemo()

            // Reload page to start fresh
            window.location.reload()

        } catch (err) {
            console.error('Error resetting demo session:', err)
        }
    }, [resetDemo])

    // Mark session as completed
    const markCompleted = useCallback(async () => {
        try {
            const sessionId = sessionStorage.getItem('demo_session_id')

            if (sessionId) {
                const sessionRef = ref(database, `demo/sessions/${sessionId}/completed`)
                await set(sessionRef, true)
            }
        } catch (err) {
            console.error('Error marking session as completed:', err)
        }
    }, [])

    return {
        loading,
        error,
        sessionData,
        resetSession,
        markCompleted,
    }
}

export default useDemoSession
