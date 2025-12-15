/**
 * DemoResetButton.jsx
 * 
 * SIMPLE EXPLANATION:
 * A button that resets the demo back to the beginning. Useful if
 * the recruiter wants to show the demo again or try different options.
 * 
 * TECHNICAL DEPTH:
 * - Clears session data from context
 * - Logs DEMO_RESET event to Firebase
 * - Restarts guided flow from step 1
 * - Reloads the page for clean state
 */

import { useState } from 'react'
import { useDemoSession } from '../hooks/useDemoSession'

function DemoResetButton() {
    const { resetSession } = useDemoSession()
    const [isResetting, setIsResetting] = useState(false)

    const handleReset = async () => {
        if (isResetting) return

        const confirmed = window.confirm(
            'Reset the demo? This will clear all progress and start fresh.'
        )

        if (!confirmed) return

        setIsResetting(true)
        await resetSession()
        // Page will reload after resetSession
    }

    return (
        <button
            className="demo-reset-button"
            onClick={handleReset}
            disabled={isResetting}
            title="Reset Demo"
        >
            {isResetting ? (
                <span className="reset-spinner" />
            ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
            )}
            <span>Reset Demo</span>
        </button>
    )
}

export default DemoResetButton
