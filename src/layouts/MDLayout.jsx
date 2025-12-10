import { useState, useEffect } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { ref, onValue } from 'firebase/database'
import { database } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

import Logo from '../components/Logo'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import './MDLayout.css'

function MDLayout() {
    const { logout, userProfile } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Default closed on mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [pendingCount, setPendingCount] = useState(0)

    const { isOnline } = useConnectionStatus()

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            if (!mobile) {
                setIsSidebarOpen(true) // Open sidebar on desktop
            }
        }

        handleResize() // Initial check
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Close sidebar on mobile when navigating
    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false)
        }
    }, [location.pathname, isMobile])

    // Real-time listener for pending attendance - show toast for new items
    useEffect(() => {
        const attendanceRef = ref(database, 'attendance')
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const pendingItems = Object.entries(data)
                    .map(([id, item]) => ({ id, ...item }))
                    .filter(item =>
                        item.status === 'pending' ||
                        item.status === 'correction_pending' ||
                        item.status === 'edit_pending'
                    )

                setPendingCount(pendingItems.length)


            } else {
                setPendingCount(0)
            }
        })

        return () => unsubscribe()
    }, [])

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }



    const menuItems = [
        {
            path: '/md/dashboard',
            label: 'Dashboard',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            )
        },
        {
            path: '/md/approvals',
            label: 'Approvals',
            badge: pendingCount > 0 ? pendingCount : null,
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            )
        },
        {
            path: '/md/employees',
            label: 'Team',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
            )
        },
        {
            path: '/md/profiles',
            label: 'Profiles',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            )
        },
        {
            path: '/md/export',
            label: 'Export',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
            )
        }
    ]

    return (
        <div className="md-layout-container">


            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`md-sidebar ${isSidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-area">
                        <Logo size={40} className="md-sidebar-logo" />
                        <span className="logo-text">ATLAS MD</span>
                    </div>
                    {isMobile && (
                        <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                            {item.badge && (
                                <span className="nav-badge">{item.badge}</span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={`md-main-wrapper ${!isMobile && isSidebarOpen ? 'with-sidebar' : ''}`}>
                {/* Top Header */}
                <header className="md-top-header">
                    <button
                        className="toggle-sidebar-btn"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>

                    <div className="header-title">
                        {menuItems.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard'}
                    </div>
                    <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                        <div className="status-dot" />
                        {isOnline ? 'Online' : 'Offline'}
                    </div>

                    <div className="header-actions">
                        {/* Notification Bell */}
                        <button
                            className="notification-bell"
                            onClick={() => navigate('/md/approvals')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {pendingCount > 0 && (
                                <span className="bell-badge">{pendingCount}</span>
                            )}
                        </button>

                        <div className="user-profile">
                            <div className="avatar">
                                {userProfile?.email?.charAt(0).toUpperCase() || 'M'}
                            </div>
                            <span className="user-role">MD</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="md-page-content">
                    <Outlet />
                </main>

                {/* Mobile Bottom Nav */}
                {isMobile && (
                    <nav className="mobile-bottom-nav">
                        {menuItems.slice(0, 4).map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`bottom-nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                            >
                                <span className="nav-icon">
                                    {item.icon}
                                    {item.badge && (
                                        <span className="bottom-nav-badge">{item.badge}</span>
                                    )}
                                </span>
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                )}
            </div>
        </div>
    )
}

export default MDLayout
