/**
 * DemoContainer.jsx
 * 
 * SIMPLE EXPLANATION:
 * This is the main layout that shows Employee view on the left and MD view
 * on the right on desktop. On mobile, it shows tabs to switch between them.
 * 
 * TECHNICAL DEPTH:
 * - Desktop (≥1024px): CSS Grid split-screen layout
 * - Mobile (<1024px): Tab-based navigation
 * - Responsive breakpoint detection via useMediaQuery
 * - Tooltip explains shared session concept on mobile
 */

import { useState, useEffect } from 'react'
import { useDemoContext } from '../context/DemoContext'
import DemoEmployeePanel from './DemoEmployeePanel'
import DemoMDPanel from './DemoMDPanel'
import DemoGuidedTour from './DemoGuidedTour'
import DemoResetButton from './DemoResetButton'
import DemoNotifications from './DemoNotifications'
import '../styles/DemoTheme.css'

function DemoContainer() {
    const { activePanel, setActivePanel, showTour } = useDemoContext()
    const [isMobile, setIsMobile] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)

    // Detect viewport size
    useEffect(() => {
        function handleResize() {
            setIsMobile(window.innerWidth < 1024)
        }

        handleResize() // Initial check
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Handle tab switch with tooltip
    const handleTabSwitch = (panel) => {
        if (panel !== activePanel) {
            setActivePanel(panel)
            setShowTooltip(true)
            setTimeout(() => setShowTooltip(false), 3000)
        }
    }

    return (
        <div className="demo-container">
            {/* Header */}
            <header className="demo-header">
                <div className="demo-header-content">
                    <div className="demo-logo">
                        <div className="demo-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="demo-logo-text">ATLAS</span>
                        <span className="demo-badge">Interactive Demo</span>
                    </div>
                    <DemoResetButton />
                </div>
            </header>

            {/* Mobile Tab Bar */}
            {isMobile && (
                <div className="demo-tab-bar">
                    <button
                        className={`demo-tab ${activePanel === 'employee' ? 'active' : ''}`}
                        onClick={() => handleTabSwitch('employee')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        Employee View
                    </button>
                    <button
                        className={`demo-tab ${activePanel === 'md' ? 'active' : ''}`}
                        onClick={() => handleTabSwitch('md')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <path d="M20 8v6" />
                            <path d="M23 11h-6" />
                        </svg>
                        MD View
                    </button>
                </div>
            )}

            {/* Tooltip for mobile tab switch */}
            {showTooltip && isMobile && (
                <div className="demo-tooltip">
                    💡 You are switching roles in the same live demo session.
                </div>
            )}

            {/* Main Content */}
            <main className="demo-main">
                {isMobile ? (
                    // Mobile: Show active panel only
                    <div className="demo-panel-container mobile">
                        {activePanel === 'employee' ? (
                            <DemoEmployeePanel />
                        ) : (
                            <DemoMDPanel />
                        )}
                    </div>
                ) : (
                    // Desktop: Split screen
                    <div className="demo-split-container">
                        <div className="demo-panel-wrapper employee">
                            <div className="demo-panel-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                Employee View
                            </div>
                            <DemoEmployeePanel />
                        </div>
                        <div className="demo-divider" />
                        <div className="demo-panel-wrapper md">
                            <div className="demo-panel-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <path d="M20 8v6" />
                                    <path d="M23 11h-6" />
                                </svg>
                                MD View
                            </div>
                            <DemoMDPanel />
                        </div>
                    </div>
                )}
            </main>

            {/* Guided Tour Overlay */}
            {showTour && <DemoGuidedTour />}

            {/* Notifications (floating) */}
            <DemoNotifications />
        </div>
    )
}

export default DemoContainer
