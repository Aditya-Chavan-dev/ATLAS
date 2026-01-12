import React from 'react'
import ReactDOM from 'react-dom/client'
import DemoApp from './DemoApp'
import '../index.css' // Reuse global tailwind styles

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <DemoApp />
    </React.StrictMode>,
)
