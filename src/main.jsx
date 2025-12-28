import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { initializeGlobalErrorHandlers } from './lib/logger'
import { config } from './config'
import logger from './utils/logger'

// Initialize error logging
initializeGlobalErrorHandlers()

// Only register Service Worker if NOT in development
if (!config.isDev && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        logger.info('SW registered:', registration);
      })
      .catch(error => {
        logger.error('SW registration failed:', error);
      });
  });
}

import ErrorBoundary from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
