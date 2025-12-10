import { useState, useEffect } from 'react'

/**
 * Custom hook to handle PWA installation
 * Handles both Android (beforeinstallprompt) and iOS (manual instructions)
 */
export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [isInstallable, setIsInstallable] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isAndroid, setIsAndroid] = useState(false)

    useEffect(() => {
        // Detect platform
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
        const isAndroidDevice = /android/.test(userAgent)
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true

        setIsIOS(isIOSDevice)
        setIsAndroid(isAndroidDevice)

        // Check if already installed (standalone mode)
        if (isInStandaloneMode) {
            setIsInstalled(true)
            return
        }

        // On iOS, we can't detect beforeinstallprompt, but we can show install instructions
        if (isIOSDevice) {
            // iOS doesn't fire beforeinstallprompt, so we show install option always
            setIsInstallable(true)
            return
        }

        // Listen for the beforeinstallprompt event (Android/Desktop Chrome)
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault()
            // Save the event so it can be triggered later
            setDeferredPrompt(e)
            setIsInstallable(true)
            console.log('✅ Install prompt captured')
        }

        // Listen for app installed event
        const handleAppInstalled = () => {
            setIsInstalled(true)
            setIsInstallable(false)
            setDeferredPrompt(null)
            console.log('✅ ATLAS PWA was installed')
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)

        // For Android, also set installable after a delay if no prompt yet
        // This handles cases where the event might have fired before our listener
        const timeout = setTimeout(() => {
            if (isAndroidDevice && !isInStandaloneMode) {
                setIsInstallable(true)
            }
        }, 3000)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
            clearTimeout(timeout)
        }
    }, [])

    const installApp = async () => {
        if (!deferredPrompt) {
            console.log('No install prompt available - user should use browser menu')
            return false
        }

        // Show the install prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice

        // Clear the deferred prompt
        setDeferredPrompt(null)

        if (outcome === 'accepted') {
            console.log('✅ User accepted the install prompt')
            setIsInstallable(false)
            return true
        } else {
            console.log('❌ User dismissed the install prompt')
            return false
        }
    }

    return {
        isInstallable,
        isInstalled,
        isIOS,
        isAndroid,
        canPrompt: !!deferredPrompt,
        installApp
    }
}

export default usePWAInstall
