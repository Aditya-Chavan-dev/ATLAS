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
        if (isIOS) {
            setShowIOSHint(true);
        } else if (canPrompt) {
            await installApp();
        } else {
            // Fallback for Incognito/Unsupported where prompt didn't fire
            setShowIncognitoHint(true);
        }
    };

    // Button is enabled if:
    // 1. Android prompt is ready
    // 2. iOS (always manual)
    // 3. Timeout passed (manual fallback)
    const isButtonEnabled = canPrompt || isIOS || checkTimeout;

    const getButtonText = () => {
        // If disabled and waiting
        if (!isButtonEnabled) return "Checking...";
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

            {/* iOS Hint */}
            {showIOSHint && (
                <div className="ios-overlay" onClick={() => setShowIOSHint(false)}>
                    <div className="ios-message">
                        Use Share <span className="share-icon"></span> → Add to Home Screen
                    </div>
                </div>
            )}

            {/* Incognito / Manual Hint */}
            {showIncognitoHint && (
                <div className="ios-overlay" onClick={() => setShowIncognitoHint(false)}>
                    <div className="ios-message" style={{ flexDirection: 'column', gap: '10px' }}>
                        <span>Cannot install in Incognito.</span>
                        <span style={{ fontSize: '14px', opacity: 0.8 }}>Open link in a normal browser tab.</span>
                    </div>
                </div>
            )}
        </div>
    );
}
