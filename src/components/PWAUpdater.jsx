import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect } from 'react'

export default function PWAUpdater() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r)
            // Check for updates every minute
            if (r) {
                setInterval(() => {
                    r.update()
                }, 60 * 1000)
            }
        },
        onRegisterError(error) {
            console.error('SW Registration Error:', error)
        }
    })

    useEffect(() => {
        if (needRefresh) {
            console.log('New content available, auto-updating...')
            updateServiceWorker(true)
        }
    }, [needRefresh, updateServiceWorker])

    return null
}
