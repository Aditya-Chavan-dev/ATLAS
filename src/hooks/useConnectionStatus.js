import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../firebase/config'

/**
 * Custom hook to track Firebase connection status
 * Returns { isOnline, lastUpdated }
 */
export function useConnectionStatus() {
    const [isOnline, setIsOnline] = useState(true)
    const [lastUpdated, setLastUpdated] = useState(new Date())

    useEffect(() => {
        // Listen to Firebase's built-in connection state
        const connectedRef = ref(database, '.info/connected')

        const unsubscribe = onValue(connectedRef, (snapshot) => {
            const connected = snapshot.val() === true
            setIsOnline(connected)
            if (connected) {
                setLastUpdated(new Date())
            }
        })

        // Also listen to browser online/offline events as fallback
        const handleOnline = () => {
            setIsOnline(true)
            setLastUpdated(new Date())
        }

        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            unsubscribe()
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return { isOnline, lastUpdated }
}
