import { Component } from 'react'

/**
 * GLOBAL ERROR BOUNDARY
 * Catches JavaScript errors anywhere in the child component tree,
 * logs them, and displays a fallback UI instead of crashing the whole app.
 * 
 * FAANG Principle: "Fail gracefully, not catastrophically."
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render shows the fallback UI
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console (In production, send to monitoring service)
        console.error('[ErrorBoundary] Caught an error:', error)
        console.error('[ErrorBoundary] Component Stack:', errorInfo.componentStack)
        this.setState({ errorInfo })

        // TODO: Send to error monitoring service (e.g., Sentry, LogRocket)
        // logErrorToService(error, errorInfo)
    }

    handleReload = () => {
        // Clear state and reload
        this.setState({ hasError: false, error: null, errorInfo: null })
        window.location.reload()
    }

    handleGoHome = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                        {/* Error Icon */}
                        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">
                            Oops! Something went wrong
                        </h1>

                        {/* Description */}
                        <p className="text-slate-600 mb-6">
                            We hit an unexpected error. Don't worry, your data is safe.
                        </p>

                        {/* Error Details (Collapsed by Default) */}
                        {this.state.error && (
                            <details className="mb-6 text-left bg-slate-50 rounded-lg p-3">
                                <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                                    Technical Details
                                </summary>
                                <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-32 p-2 bg-slate-100 rounded">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
                            >
                                Reload App
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                            >
                                Go Home
                            </button>
                        </div>

                        {/* Footer */}
                        <p className="mt-6 text-xs text-slate-400">
                            If this keeps happening, please contact support.
                        </p>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
