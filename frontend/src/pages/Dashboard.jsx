import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { getTodayAttendance, getPendingApprovals } from '../services/attendanceService';
import '../styles/ManagerStyles.css';
import '../styles/EmployeeStyles.css';

/**
 * Dashboard Page
 * Acts as the main landing page.
 * - For MD: Shows pending approvals summary.
 * - For Employees: Shows today's attendance status and quick actions.
 */
const Dashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // State
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mock Statistics for Demo (In real app, fetch from API)
    const [stats, setStats] = useState({
        pendingApprovals: 3, // Mock count for MD
        presentDays: 18,     // Mock count for Employee
        totalDays: 22        // Mock count for Employee
    });

    useEffect(() => {
        fetchDashboardData();

        // Auto-refresh every 10 seconds for real-time updates
        const interval = setInterval(() => {
            fetchDashboardData();
        }, 10000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            if (currentUser?.role !== 'MD') {
                // Fetch Employee Data
                if (currentUser?.uid) {
                    const response = await getTodayAttendance(currentUser.uid);
                    setTodayAttendance(response?.data || null);
                }
            } else {
                // Fetch MD Data (pending approvals count)
                const pending = await getPendingApprovals();
                const pendingArray = Array.isArray(pending) ? pending : [];
                setStats(prev => ({ ...prev, pendingApprovals: pendingArray.length }));
            }

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullPage message="Loading dashboard..." />;
    }

    const isMD = currentUser?.role === 'MD';

    return (
        <div className={isMD ? "manager-dashboard" : "employee-container"}>
            {/* Welcome Header */}
            <div className="text-center mb-xl fade-in">
                <h1 className="gradient-text text-3xl font-bold mb-sm">
                    Welcome back!
                </h1>
                <p className="text-muted text-lg">
                    {currentUser?.displayName || currentUser?.email || 'User'}
                </p>
            </div>

            {isMD ? (
                /* ================= MD VIEW ================= */
                <div className="fade-in">
                    <div className="stats-grid">
                        <div className="stat-card text-center">
                            <p className="text-muted text-sm">Pending Approvals</p>
                            <div className="stat-value text-warning">
                                {stats.pendingApprovals}
                            </div>
                            <Button
                                variant="primary"
                                onClick={() => navigate('/attendance/approvals')}
                                className="w-full mt-md"
                            >
                                Review Approvals
                            </Button>
                        </div>

                        <div className="stat-card text-center">
                            <p className="text-muted text-sm">Total Employees</p>
                            <div className="stat-value text-primary">
                                12 {/* Mock Data */}
                            </div>
                            <Button
                                variant="outline"
                                className="w-full mt-md"
                                disabled
                            >
                                Manage Employees
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                /* ================= EMPLOYEE VIEW ================= */
                <div className="fade-in">
                    {/* Today's Status Card */}
                    {todayAttendance ? (
                        <Card className="mb-xl text-center attendance-card">
                            <p className="text-muted text-sm mb-sm">Today's Attendance</p>

                            <div className="text-2xl font-bold mb-xs">
                                {todayAttendance.type}
                            </div>
                            {todayAttendance.siteName && (
                                <div className="text-muted text-md mb-md">
                                    {todayAttendance.siteName}
                                </div>
                            )}

                            <div className="mb-md">
                                <StatusBadge status={todayAttendance.status} />
                            </div>

                            {todayAttendance.status === 'Pending' && (
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/attendance/mark')}
                                    className="w-full mt-md"
                                >
                                    ✏️ Edit Attendance
                                </Button>
                            )}

                            {todayAttendance.status === 'Rejected' && (
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/attendance/mark')}
                                    className="w-full mt-md"
                                >
                                    🔄 Remark Attendance
                                </Button>
                            )}
                        </Card>
                    ) : (
                        /* Mark Attendance Call-to-Action */
                        <div className="mb-xl">
                            <button
                                onClick={() => navigate('/attendance/mark')}
                                className="mark-attendance-btn hover-lift"
                            >
                                <span className="text-4xl mb-sm">📍</span>
                                <span className="text-xl font-bold">Mark Attendance</span>
                                <span className="text-sm opacity-90 font-normal mt-xs">
                                    Tap to mark your attendance for today
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Monthly Stats Summary */}
                    <Card className="mb-xl">
                        <h3 className="text-lg font-bold mb-md">This Month</h3>

                        <div className="grid-2-cols gap-md mb-md">
                            <div className="stat-box bg-primary-light">
                                <div className="text-2xl font-bold text-primary">{stats.presentDays}</div>
                                <div className="text-xs text-muted">Days Present</div>
                            </div>
                            <div className="stat-box bg-secondary-light">
                                <div className="text-2xl font-bold text-secondary">{stats.totalDays}</div>
                                <div className="text-xs text-muted">Working Days</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-md">
                            <div className="flex justify-between items-center mb-xs">
                                <span className="text-xs text-muted">Attendance Rate</span>
                                <span className="text-sm font-bold text-primary">
                                    {Math.round((stats.presentDays / stats.totalDays) * 100)}%
                                </span>
                            </div>
                            <div className="progress-bar-bg">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${(stats.presentDays / stats.totalDays) * 100}%` }}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Quick Links */}
                    <div className="grid-2-cols gap-md">
                        <button onClick={() => navigate('/attendance/my')} className="quick-link-btn hover-lift">
                            <span className="text-2xl mb-xs">📊</span>
                            <span className="font-medium">My Attendance</span>
                        </button>
                        <button onClick={() => navigate('/attendance/my')} className="quick-link-btn hover-lift">
                            <span className="text-2xl mb-xs">📅</span>
                            <span className="font-medium">History</span>
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .text-3xl { font-size: 1.875rem; }
                .text-2xl { font-size: 1.5rem; }
                .text-xl { font-size: 1.25rem; }
                .text-lg { font-size: 1.125rem; }
                .text-md { font-size: 1rem; }
                .text-sm { font-size: 0.875rem; }
                .text-xs { font-size: 0.75rem; }
                .text-4xl { font-size: 2.25rem; }
                
                .font-bold { font-weight: 700; }
                .font-medium { font-weight: 500; }
                .font-normal { font-weight: 400; }
                
                .text-center { text-align: center; }
                .text-muted { color: var(--text-secondary); }
                .text-primary { color: var(--primary); }
                .text-secondary { color: var(--secondary); }
                .text-warning { color: var(--warning); }
                
                .mb-xs { margin-bottom: var(--spacing-xs); }
                .mb-sm { margin-bottom: var(--spacing-sm); }
                .mb-md { margin-bottom: var(--spacing-md); }
                .mb-xl { margin-bottom: var(--spacing-xl); }
                .mt-md { margin-top: var(--spacing-md); }
                .mt-xs { margin-top: var(--spacing-xs); }
                
                .w-full { width: 100%; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .items-center { align-items: center; }
                
                .grid-2-cols {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                }
                
                .mark-attendance-btn {
                    width: 100%;
                    padding: var(--spacing-xl);
                    border-radius: var(--border-radius);
                    border: none;
                    background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
                    color: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--spacing-sm);
                }
                .mark-attendance-btn:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(99, 102, 241, 0.4);
                }
                
                .stat-box {
                    padding: var(--spacing-md);
                    border-radius: var(--border-radius);
                    text-align: center;
                }
                .bg-primary-light { background: rgba(99, 102, 241, 0.1); }
                .bg-secondary-light { background: rgba(236, 72, 153, 0.1); }
                
                .progress-bar-bg {
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--primary), var(--secondary));
                    border-radius: 4px;
                    transition: width 0.5s ease;
                }
                
                .quick-link-btn {
                    padding: var(--spacing-lg);
                    border-radius: var(--border-radius);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--spacing-sm);
                }
                .quick-link-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateY(-2px);
                }

                .gradient-text {
                    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
