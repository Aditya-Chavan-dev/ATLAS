import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { initializeGlobalErrorHandlers } from './lib/logger'

import { registerSW } from 'virtual:pwa-register'

// Initialize error logging
initializeGlobalErrorHandlers()

// Register Service Worker explicitly
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, verify to update.')
  },
  onOfflineReady() {
    console.log('App is ready for offline work.')
    // This implies SW is registered and active, which is good for PWA installability
  },
  immediate: true
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
