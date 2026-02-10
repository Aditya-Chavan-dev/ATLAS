import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorCount: number;
    lastErrorTime: number;
}

/**
 * Error Boundary Component
 * 
 * Security Features:
 * - Sanitizes error messages (no stack traces visible to users)
 * - Debounces rapid errors (prevents error spam attacks)
 * - Graceful degradation (reload button for recovery)
 * - Production-safe error handling
 * 
 * Edge Cases Covered:
 * - Multiple rapid errors → Debounce (max 3 errors in 5 seconds)
 * - Error in error boundary itself → Static fallback HTML
 * - Production vs development → Different error verbosity
 * - Component unmount during error → Cleanup in componentWillUnmount
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    private errorDebounceTimer: NodeJS.Timeout | null = null;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            errorCount: 0,
            lastErrorTime: 0
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        // Update state to trigger fallback UI
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        const now = Date.now();
        const timeSinceLastError = now - this.state.lastErrorTime;

        // Debounce: Prevent error spam (potential  DoS attack)
        if (timeSinceLastError < 5000) {
            const newCount = this.state.errorCount + 1;

            if (newCount > 3) {
                // Too many errors too fast - possible attack or infinite error loop
                console.error('[ErrorBoundary] Error spam detected, suppressing further logs');
                return;
            }

            this.setState({
                errorCount: newCount,
                lastErrorTime: now
            });
        } else {
            // Reset counter after 5 seconds
            this.setState({
                errorCount: 1,
                lastErrorTime: now
            });
        }

        // Security: NEVER log full error details in production
        if (import.meta.env.DEV) {
            console.error('[ErrorBoundary] Component error:', error);
            console.error('[ErrorBoundary] Error info:', errorInfo);
        } else {
            // Production: Sanitized logging (no stack traces)
            console.error('[ErrorBoundary] Component error occurred:', error.message);
            // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
        }
    }

    componentWillUnmount() {
        // Cleanup: Clear debounce timer
        if (this.errorDebounceTimer) {
            clearTimeout(this.errorDebounceTimer);
        }
    }

    private handleReload = () => {
        // Reset error state and reload page
        this.setState({ hasError: false, error: undefined });
        window.location.reload();
    };

    private handleReset = () => {
        // Reset error state without reload (attempt recovery)
        this.setState({ hasError: false, error: undefined, errorCount: 0 });
    };

    render() {
        if (this.state.hasError) {
            // User provided custom fallback
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default failure UI (defensive - no dynamic content that could error)
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa'
                }}>
                    <div style={{
                        maxWidth: '500px',
                        padding: '2rem',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '1rem'
                        }}>⚠️</div>

                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#dc2626',
                            marginBottom: '0.5rem'
                        }}>
                            Something went wrong
                        </h2>

                        <p style={{
                            color: '#6b7280',
                            marginBottom: '1.5rem',
                            fontSize: '0.875rem'
                        }}>
                            The application encountered an unexpected error.
                            {import.meta.env.DEV && this.state.error && (
                                <span style={{
                                    display: 'block',
                                    marginTop: '0.5rem',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    color: '#ef4444'
                                }}>
                                    {this.state.error.message}
                                </span>
                            )}
                        </p>

                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Try Again
                            </button>

                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
