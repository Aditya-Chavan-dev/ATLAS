import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'
import './Navbar.css'

function Navbar() {
    const { logout } = useAuth()
    const navigate = useNavigate()

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
                {/* Logo Removed as per request */}
                <div className="navbar-brand-placeholder"></div>

                {/* Right Section */}
                <div className="navbar-simple-actions">
                    <ThemeToggle />
                    <button
                        className="navbar-logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
