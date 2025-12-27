import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import MetricsView from '../components/owner/MetricsView'
import AdminView from '../components/owner/AdminView'
import './MetricsDashboard.css'

function MetricsDashboard() {
    const { currentUser, logout } = useAuth()
    const [activeSection, setActiveSection] = useState('admin') // 'admin' | 'metrics'

    return (
        <div className="metrics-dashboard min-h-screen bg-slate-100">
            {/* Top Navigation Bar */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Left: Brand & Tabs */}
                        <div className="flex items-center space-x-8">
                            <h1 className="text-xl font-bold text-slate-800 flex items-center">
                                <span className="bg-blue-600 text-white p-1 rounded mr-2 text-sm">OWNER</span>
                                Dashboard
                            </h1>

                            <nav className="flex space-x-4">
                                <button
                                    onClick={() => setActiveSection('admin')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === 'admin'
                                            ? 'bg-slate-900 text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    ATLAS (Admin)
                                </button>
                                <button
                                    onClick={() => setActiveSection('metrics')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === 'metrics'
                                            ? 'bg-slate-900 text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    ATLAS Metric
                                </button>
                            </nav>
                        </div>

                        {/* Right: User & Actions */}
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-slate-500 hidden md:block">{currentUser?.email}</span>
                            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                            <button
                                onClick={() => window.location.href = '/md/dashboard'}
                                className="text-sm font-medium text-slate-600 hover:text-slate-900"
                            >
                                Go to App
                            </button>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {activeSection === 'admin' ? (
                    <AdminView currentUser={currentUser} />
                ) : (
                    <MetricsView currentUser={currentUser} />
                )}
            </main>
        </div>
    )
}

export default MetricsDashboard
