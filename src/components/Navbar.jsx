import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

function Navbar({ toggleSidebar, isDesktop }) {
    const { logout } = useAuth()
    const navigate = useNavigate()

    // Note: ThemeToggle is removed as per strict new design (not mentioned in specs)
    // If needed, it can be re-added, but specs focus on specific colors.

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <nav className="navbar-simple">
            <div className="navbar-simple-container">
                {/* Leftmost Section */}
                <div className="navbar-left" onClick={toggleSidebar}>
                    <svg className="hamburger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </div>

                {/* Center Section */}
                <div className="navbar-center">
                    <div className="navbar-logo-bg">
                        A
                    </div>
                    <span className="navbar-brand-text">ATLAS</span>
                </div>

                {/* Rightmost Section */}
                <div className="navbar-right">
                    <svg className="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>

                    <button
                        className="navbar-logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
