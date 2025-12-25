import { useEffect, useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import './InstallPage.css';

export default function InstallPage() {
    const { canPrompt, isIOS, isInstalled, installApp } = usePWAInstall();
    const [installing, setInstalling] = useState(false);

    // Already Installed Case - Redirect immediately
    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            window.location.replace('/');
        }
        if (isInstalled) {
            window.location.replace('/');
        }
    }, [isInstalled]);

    const handleInstallClick = async () => {
        if (canPrompt) {
            setInstalling(true);
            await installApp();
            setInstalling(false);
        }
    };

    // Show iOS instructions
    if (isIOS) {
        return (
            <div className="install-container">
                <div className="install-header">
                    <h1>📱 Install ATLAS</h1>
                    <p className="install-subtitle">Add ATLAS to your iPhone Home Screen</p>
                </div>

                <div className="install-steps">
                    <div className="install-step">
                        <span className="step-number">1</span>
                        <div className="step-content">
                            <h3>Tap the Share button</h3>
                            <p>Look for <span className="ios-icon">📤</span> at the bottom of Safari</p>
                        </div>
                    </div>

                    <div className="install-step">
                        <span className="step-number">2</span>
                        <div className="step-content">
                            <h3>Scroll and select "Add to Home Screen"</h3>
                            <p>You'll see the ATLAS icon</p>
                        </div>
                    </div>

                    <div className="install-step">
                        <span className="step-number">3</span>
                        <div className="step-content">
                            <h3>Tap "Add"</h3>
                            <p>ATLAS will appear on your home screen</p>
                        </div>
                    </div>
                </div>

                <a href="/" className="back-link">← Back to Login</a>
            </div>
        );
    }

    // Show Android install button or instructions
    return (
        <div className="install-container">
            <div className="install-header">
                <h1>📱 Install ATLAS</h1>
                <p className="install-subtitle">Get the app experience on your device</p>
            </div>

            {canPrompt ? (
                <>
                    <p className="install-text">Click the button below to install ATLAS as an app on your phone.</p>
                    <button
                        className="install-button"
                        onClick={handleInstallClick}
                        disabled={installing}
                    >
                        {installing ? 'Installing...' : '⬇️ Install Now'}
                    </button>
                </>
            ) : (
                <div className="install-manual">
                    <p className="install-text"><strong>To install ATLAS:</strong></p>
                    <div className="install-step">
                        <span className="step-number">1</span>
                        <div className="step-content">
                            <p>Tap the <strong>menu button</strong> (⋮) in your browser</p>
                        </div>
                    </div>
                    <div className="install-step">
                        <span className="step-number">2</span>
                        <div className="step-content">
                            <p>Look for <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong></p>
                        </div>
                    </div>
                    <div className="install-step">
                        <span className="step-number">3</span>
                        <div className="step-content">
                            <p>Tap <strong>"Install"</strong></p>
                        </div>
                    </div>
                </div>
            )}

            <a href="/" className="back-link">← Back to Login</a>
        </div>
    );
}
