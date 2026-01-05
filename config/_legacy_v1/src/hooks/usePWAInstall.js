import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [canPrompt, setCanPrompt] = useState(false);

    useEffect(() => {
        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        // Initial sync with global prompt if it already fired
        if (window.deferredPWAPrompt) {
            setDeferredPrompt(window.deferredPWAPrompt);
            setIsInstallable(true);
            setCanPrompt(true);
        }

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
            setCanPrompt(true);
            // Also update the global variable just in case
            window.deferredPWAPrompt = e;
            console.log('👋 PWA Install Prompt captured');
        };

        const handleAppInstalled = () => {
            console.log('✅ PWA was installed');
            setIsInstalled(true);
            setIsInstallable(false);
            setCanPrompt(false);
            setDeferredPrompt(null);
            window.deferredPWAPrompt = null;
        };

        const handleGlobalPromptAvailable = () => {
            if (window.deferredPWAPrompt) {
                setDeferredPrompt(window.deferredPWAPrompt);
                setIsInstallable(true);
                setCanPrompt(true);
            }
        };

        // Check if already in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsInstalled(true);
            setIsInstallable(false);
            setCanPrompt(false);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('pwa-prompt-available', handleGlobalPromptAvailable);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('pwa-prompt-available', handleGlobalPromptAvailable);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) {
            console.warn('❌ No install prompt available');
            return false;
        }

        // Trigger native prompt immediately
        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);

            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                window.deferredPWAPrompt = null;
                setIsInstallable(false);
                setCanPrompt(false);
                return true;
            }
        } catch (err) {
            console.error('Failed to trigger PWA prompt:', err);
        }
        return false;
    };

    return { isInstallable, isInstalled, isIOS, canPrompt, installApp };
}
