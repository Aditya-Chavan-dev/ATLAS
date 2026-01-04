/**
 * DemoGuidedTour.jsx
 * 
 * SIMPLE EXPLANATION:
 * This is the step-by-step walkthrough overlay that guides recruiters
 * through the demo. It highlights what to click next and explains
 * what's happening at each step.
 * 
 * TECHNICAL DEPTH:
 * - Step-based instructional overlay
 * - No auto-timers - all progression requires real clicks
 * - Highlights relevant UI elements with focus rings
 * - 5 steps covering the full attendance workflow
 * 
 * DEMO FLOW RULES:
 * - No fake approvals
 * - All actions are real clicks
 * - User controls the pace
 */

import { useDemoContext } from '../context/DemoContext'
import { useDemoMetrics } from '../hooks/useDemoMetrics'

// Tour steps configuration
const TOUR_STEPS = [
    {
        id: 0,
        title: 'Mark Your Attendance',
        description: 'As an employee, click "Mark Attendance" button to log your work location for today.',
        panel: 'employee',
        highlight: '[data-tour-step="0"]',
        position: 'bottom',
    },
    {
        id: 1,
        title: 'Notification Sent',
        description: 'Great! Your attendance is marked. Notice the notification confirming your submission.',
        panel: 'employee',
        highlight: '[data-tour-step="1"]',
        position: 'top',
    },
    {
        id: 2,
        title: 'MD Receives Request',
        description: 'Now look at the MD panel - a new approval request has appeared in real-time.',
        panel: 'md',
        highlight: '[data-tour-step="2"]',
        position: 'top',
    },
    {
        id: 3,
        title: 'Approve the Request',
        description: 'As MD, review the request and click "Approve" to confirm the attendance.',
        panel: 'md',
        highlight: '[data-tour-step="3"]',
        position: 'top',
    },
    {
        id: 4,
        title: 'Demo Complete! 🎉',
        description: 'Both sides now show confirmation. The employee is notified of the approval. This is the core ATLAS workflow!',
        panel: 'both',
        highlight: null,
        position: 'center',
    },
]

function DemoGuidedTour() {
    const { currentStep, toggleTour, setCompleted, screenMode, setActivePanel, resetDemo } = useDemoContext()
    const { logDemoCompleted } = useDemoMetrics()

    const step = TOUR_STEPS[currentStep] || TOUR_STEPS[TOUR_STEPS.length - 1]
    const isLastStep = currentStep >= TOUR_STEPS.length - 1

    // Handle closing the tour
    const handleCloseTour = () => {
        if (isLastStep) {
            setCompleted()
            logDemoCompleted()
        }
        toggleTour(false)
    }

    // Handle "Explore Further" - reset demo data but skip tour for free exploration
    const handleExploreFurther = () => {
        logDemoCompleted()
        // First hide tour, then reset (order matters to prevent flash)
        toggleTour(false)
        // Use setTimeout to let state update before reset
        setTimeout(() => {
            resetDemo()
        }, 100)
    }

    // Handle switching to correct panel on mobile
    const handleFocusPanel = () => {
        if (screenMode === 'tab' && step.panel !== 'both') {
            setActivePanel(step.panel)
        }
    }

    return (
        <div className="demo-tour-overlay">
            {/* Semi-transparent backdrop */}
            <div className="tour-backdrop" />

            {/* Tour card */}
            <div className={`tour-card step-${currentStep}`}>
                {/* Progress indicator */}
                <div className="tour-progress">
                    {TOUR_STEPS.map((s, idx) => (
                        <div
                            key={s.id}
                            className={`progress-dot ${idx <= currentStep ? 'active' : ''} ${idx === currentStep ? 'current' : ''}`}
                        />
                    ))}
                </div>

                {/* Step content */}
                <div className="tour-content">
                    <div className="tour-step-number">Step {currentStep + 1} of {TOUR_STEPS.length}</div>
                    <h3 className="tour-title">{step.title}</h3>
                    <p className="tour-description">{step.description}</p>

                    {/* Panel indicator for mobile */}
                    {screenMode === 'tab' && step.panel !== 'both' && (
                        <div className="tour-panel-hint" onClick={handleFocusPanel}>
                            👆 Look at the <strong>{step.panel === 'employee' ? 'Employee' : 'MD'}</strong> tab
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="tour-actions">
                    {isLastStep ? (
                        <>
                            <button className="tour-explore" onClick={handleExploreFurther}>
                                🔄 Explore Further
                            </button>
                            <button className="tour-complete" onClick={handleCloseTour}>
                                ✓ Done
                            </button>
                        </>
                    ) : (
                        <button className="tour-skip" onClick={handleCloseTour}>
                            Skip Tour
                        </button>
                    )}
                </div>

                {/* Tips */}
                {!isLastStep && (
                    <div className="tour-tip">
                        💡 Complete the highlighted action to continue
                    </div>
                )}
            </div>

            {/* Highlight spotlight (only on desktop or when panel matches) */}
            {step.highlight && (
                <style>
                    {`
                        ${step.highlight} {
                            position: relative;
                            z-index: 1001;
                            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3);
                            border-radius: 12px;
                            animation: tour-pulse 2s infinite;
                        }
                        
                        @keyframes tour-pulse {
                            0%, 100% {
                                box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3);
                            }
                            50% {
                                box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.3), 0 0 30px rgba(99, 102, 241, 0.2);
                            }
                        }
                    `}
                </style>
            )}
        </div>
    )
}

export default DemoGuidedTour
