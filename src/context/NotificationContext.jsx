import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import FloatingNotification from '../components/FloatingNotification'

const NotificationContext = createContext()

export const useNotification = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider')
    }
    return context
}

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null)

    const showNotification = useCallback((payload) => {
        // payload: { title, body, icon, actionLabel, onAction }
        setNotification({
            ...payload,
            id: Date.now()
        })

        // Auto-dismiss after 8 seconds (longer than standard toasts for 'floating' feel)
        setTimeout(() => {
            setNotification(prev => prev?.id === payload.id ? null : prev)
        }, 8000)
    }, [])

    const hideNotification = useCallback(() => {
        setNotification(null)
    }, [])

    return (
        <NotificationContext.Provider value={{ showNotification, hideNotification }}>
            {children}
            <AnimatePresence>
                {notification && (
                    <FloatingNotification
                        key={notification.id}
                        {...notification}
                        onClose={hideNotification}
                    />
                )}
            </AnimatePresence>
        </NotificationContext.Provider>
    )
}
