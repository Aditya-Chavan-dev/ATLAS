
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const logError = async (error, componentStack = null) => {
    try {
        const payload = {
            message: error.message || String(error),
            stack: error.stack || null,
            componentStack: componentStack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };

        // Use sendBeacon for more reliable logging during page unload/crashes
        // Fallback to fetch if payload is too large or sendBeacon not supported
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

        if (navigator.sendBeacon) {
            navigator.sendBeacon(`${API_URL}/api/log-error`, blob);
        } else {
            await fetch(`${API_URL}/api/log-error`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        }
    } catch (loggingError) {
        console.error('Failed to log error to backend:', loggingError);
    }
};

export const initializeGlobalErrorHandlers = () => {
    window.onerror = (message, source, lineno, colno, error) => {
        logError(error || new Error(message));
    };

    window.onunhandledrejection = (event) => {
        logError(event.reason || new Error('Unhandled Promise Rejection'));
    };
};
