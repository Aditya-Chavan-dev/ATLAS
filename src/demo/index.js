/**
 * Demo Module Index
 * 
 * Centralizes exports for the demo application.
 * This module is completely isolated from production.
 */

// Main entry point
export { default as DemoApp } from './DemoApp'

// Components
export { default as DemoContainer } from './components/DemoContainer'
export { default as DemoEmployeePanel } from './components/DemoEmployeePanel'
export { default as DemoMDPanel } from './components/DemoMDPanel'
export { default as DemoGuidedTour } from './components/DemoGuidedTour'
export { default as DemoNotifications } from './components/DemoNotifications'
export { default as DemoResetButton } from './components/DemoResetButton'

// Context
export { DemoProvider, useDemoContext, DEMO_ACTIONS } from './context/DemoContext'

// Hooks
export { useDemoSession } from './hooks/useDemoSession'
export { useDemoMetrics, ALLOWED_EVENTS } from './hooks/useDemoMetrics'
