import { useState, useEffect } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { ref, onValue } from 'firebase/database'
import { database } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import './MDLayout.css'

function MDLayout() {
    const { logout, userProfile } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true) // Sidebar visible by default on desktop
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [pendingCount, setPendingCount] = useState(0)

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            // On desktop, keep sidebar open by default unless toggled (logic below covers initial state)
            if (!mobile && !isSidebarOpen) {
                setIsSidebarOpen(true)
            }
            if (mobile && isSidebarOpen) {
                setIsSidebarOpen(false) // Default closed on mobile
            }
        }

        handleResize() // Initial check
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Real-time listener for pending attendance
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

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const menuItems = [
        {
            path: '/md/dashboard',
            label: 'Dashboard',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
                </svg>
            )
        },
        {
            path: '/md/approvals',
            label: 'Approvals',
            badge: pendingCount > 0 ? pendingCount : null,
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            )
        },
        {
            path: '/md/employees',
            label: 'Team',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            )
        },
        {
            path: '/md/profiles',
            label: 'Profiles',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                </svg>
            )
        },
        {
            path: '/md/export',
            label: 'Export',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            )
        }
    ]

    return (
        <div className="md-layout-container">
            {/* Navbar (Fixed) */}
            <Navbar toggleSidebar={toggleSidebar} isDesktop={!isMobile} />

            {/* Mobile Sidebar Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`md-sidebar ${isSidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
                {/* Mobile Header inside Sidebar (Hidden on desktop) */}
                <div className="sidebar-header">
                    <span className="logo-text" style={{ fontSize: '20px', fontWeight: 'bold' }}>ATLAS</span>
                    <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                            onClick={() => isMobile && setIsSidebarOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                            {/* Assuming badge logic is still handled, though not explicitly in CSS spec for Sidebar, adding it back if valid */}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={`md-main-wrapper ${!isMobile && isSidebarOpen ? 'with-sidebar' : ''}`}>
                {/* Page Content */}
                <main className="md-page-content">
                    <Outlet />
                </main>

                {/* Mobile Bottom Nav (Visible < 768px) */}
                {isMobile && (
                    <nav className="mobile-bottom-nav">
                        {menuItems.slice(0, 4).map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`bottom-nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                            >
                                <span className="nav-icon">{item.icon}</span>
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
