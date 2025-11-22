import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import Button from './Button';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const navLinks = [
        { path: '/dashboard', label: '🏠 Dashboard' },
        { path: '/attendance/mark', label: '📍 Mark Attendance' },
        { path: '/attendance/my', label: '📊 My Attendance' },
        { path: '/attendance/approvals', label: '✅ Approvals', mdOnly: true },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav className="glass-card" style={{
                padding: 'var(--spacing-md) var(--spacing-xl)',
                marginBottom: 'var(--spacing-xl)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    {/* Logo */}
                    <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                        <div>
                            <h2 className="gradient-text" style={{ marginBottom: 0 }}>ATLAS</h2>
                            <p style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginTop: 'var(--spacing-xs)'
                            }}>
                                Attendance Tracking System
                            </p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div style={{
                        display: 'flex',
                        gap: 'var(--spacing-md)',
                        alignItems: 'center'
                    }} className="desktop-nav">
                        {navLinks.filter(link => !link.mdOnly || currentUser?.role === 'MD').map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    textDecoration: 'none',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: isActive(link.path) ? 'var(--primary-light)' : 'var(--text-secondary)',
                                    background: isActive(link.path) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    border: isActive(link.path) ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                                    transition: 'all var(--transition-base)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive(link.path)) {
                                        e.target.style.background = 'rgba(148, 163, 184, 0.05)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive(link.path)) {
                                        e.target.style.background = 'transparent';
                                    }
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* User Menu */}
                    {currentUser && (
                        <div className="flex items-center gap-md desktop-nav">
                            <div style={{ textAlign: 'right' }}>
                                <p style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)'
                                }}>
                                    {currentUser.email}
                                </p>
                            </div>
                            <Button variant="outline" onClick={handleLogout}>
                                Logout
                            </Button>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{
                            display: 'none',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: 'var(--spacing-sm)'
                        }}
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="mobile-nav" style={{
                        marginTop: 'var(--spacing-lg)',
                        paddingTop: 'var(--spacing-lg)',
                        borderTop: '1px solid var(--glass-border)',
                        display: 'none',
                        flexDirection: 'column',
                        gap: 'var(--spacing-sm)'
                    }}>
                        {navLinks.filter(link => !link.mdOnly || currentUser?.role === 'MD').map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                style={{
                                    textDecoration: 'none',
                                    padding: 'var(--spacing-md)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: isActive(link.path) ? 'var(--primary-light)' : 'var(--text-secondary)',
                                    background: isActive(link.path) ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                                    border: isActive(link.path) ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--glass-border)'
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div style={{
                            padding: 'var(--spacing-md)',
                            borderTop: '1px solid var(--glass-border)',
                            marginTop: 'var(--spacing-sm)'
                        }}>
                            <p style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-muted)',
                                marginBottom: 'var(--spacing-sm)'
                            }}>
                                {currentUser?.email}
                            </p>
                            <Button variant="outline" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
                                Logout
                            </Button>
                        </div>
                    </div>
                )}
            </nav>

            <style>{`
                @media (max-width: 768px) {
                    .desktop-nav {
                        display: none !important;
                    }
                    .mobile-menu-btn {
                        display: block !important;
                    }
                    .mobile-nav {
                        display: flex !important;
                    }
                }
            `}</style>
        </>
    );
};

export default Navbar;

