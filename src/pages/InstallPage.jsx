import { useEffect, useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import './InstallPage.css';

export default function InstallPage() {
    const { canPrompt, isIOS, isInstalled, installApp } = usePWAInstall();
    const [showIOSHint, setShowIOSHint] = useState(false);
    const [showIncognitoHint, setShowIncognitoHint] = useState(false);
    const [checkTimeout, setCheckTimeout] = useState(false);

    // 5. Already Installed Case / Success Case - Redirect immediately
    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            window.location.replace('/');
        }
        if (isInstalled) {
            window.location.replace('/');
        }
    }, [isInstalled]);

    // Timeout to stop "Checking..." forever (e.g. Incognito or unsupported browser)
    useEffect(() => {
        const timer = setTimeout(() => {
            setCheckTimeout(true);
        }, 2500); // 2.5s timeout
        return () => clearTimeout(timer);
    }, []);

    const handleInstallClick = async () => {
        if (canPrompt) {
            await installApp();
        }
        // Silent failure for unsupported browsers (No manual instructions)
    };

    // Button is enabled only if native prompt is ready
    const isButtonEnabled = canPrompt;

    const getButtonText = () => {
        // If disabled and waiting
        if (!isButtonEnabled) return "Install Not Available";
        return "Install";
    }

    return (
        <div className="install-container">
            <p className="install-text">This will install ATLAS into your phone.</p>

            <button
                className={`install-button ${!isButtonEnabled ? 'disabled' : ''}`}
                onClick={handleInstallClick}
                disabled={!isButtonEnabled}
            >
                {getButtonText()}
            </button>
        </div>
    );
}
