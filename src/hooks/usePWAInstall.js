import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [isIOS, setIsIOS] = useState(false);
    const [canPrompt, setCanPrompt] = useState(false);

    useEffect(() => {
        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
            setCanPrompt(true);
            console.log('👋 PWA Install Prompt captured');
        };

        const handleAppInstalled = () => {
            console.log('✅ PWA was installed');
            setIsInstalled(true);
            setIsInstallable(false);
            setCanPrompt(false);
            setDeferredPrompt(null);
        };

        // Check if already in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsInstalled(true);
            setIsInstallable(false);
            setCanPrompt(false);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) {
            console.warn('❌ No install prompt available');
            return false;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
            setCanPrompt(false);
            return true;
        }
        return false;
    };

    return { isInstallable, isInstalled, isIOS, canPrompt, installApp };
}
