import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyAttendance } from '../services/attendanceService';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/EmployeeStyles.css';

/**
 * MyAttendance Page
 * Displays the attendance history for the logged-in employee.
 * Includes filtering by status and date range.
 */
const MyAttendance = () => {
    const { currentUser } = useAuth();

    // State Management
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });

    // Fetch attendance history on mount
    useEffect(() => {
        fetchAttendanceHistory();
    }, []);

    /**
     * Fetches attendance history from the backend.
     */
    const fetchAttendanceHistory = async () => {
        setLoading(true);
        try {
            if (currentUser?.uid) {
                const response = await getMyAttendance(currentUser.uid);
                // API returns { success: true, data: [...] }
                setAttendanceData(response?.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch attendance history:', error);
            // In a real app, you might show a toast error here
        } finally {
            setLoading(false);
        }
    };

    /**
     * Filters attendance data based on selected status and date range.
     */
    const filteredData = attendanceData.filter(record => {
        // Status Filter
        if (filterStatus !== 'All' && record.status !== filterStatus) {
            return false;
        }
        // Date Range Filter
        if (dateRange.start && record.date < dateRange.start) {
            return false;
        }
        if (dateRange.end && record.date > dateRange.end) {
            return false;
        }
        return true;
    });

    // Calculate Summary Stats
    const stats = {
        total: attendanceData.length,
        present: attendanceData.filter(r => r.status === 'Approved' || r.status === 'Pending').length, // Assuming Approved/Pending counts as present for now
        rejected: attendanceData.filter(r => r.status === 'Rejected').length,
        site: attendanceData.filter(r => r.type === 'Site').length,
        office: attendanceData.filter(r => r.type === 'Office').length
    };

    if (loading) {
        return <LoadingSpinner fullPage message="Loading attendance history..." />;
    }

    return (
        <div className="employee-container fade-in">
            <div className="mb-xl">
                <h1 className="gradient-text">Attendance History</h1>
                <p className="text-muted">View your attendance records</p>
            </div>

            {/* Summary Stats Cards */}
            <div className="stats-grid mb-xl">
                <div className="glass-card p-md text-center">
                    <p className="text-muted text-xs mb-xs">Total Days</p>
                    <h3 className="text-2xl">{stats.total}</h3>
                </div>
                <div className="glass-card p-md text-center">
                    <p className="text-muted text-xs mb-xs">Present</p>
                    <h3 className="text-2xl text-accent">{stats.present}</h3>
                </div>
                <div className="glass-card p-md text-center">
                    <p className="text-muted text-xs mb-xs">Rejected</p>
                    <h3 className="text-2xl text-error">{stats.rejected}</h3>
                </div>
                <div className="glass-card p-md text-center">
                    <p className="text-muted text-xs mb-xs">Site Visits</p>
                    <h3 className="text-2xl text-primary">{stats.site}</h3>
                </div>
            </div>

            {/* Filters Section */}
            <Card className="mb-lg">
                <h3 className="mb-lg">Filters</h3>
                <div className="filter-grid">
                    <div>
                        <label>Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="All">All</option>
                            <option value="Approved">Approved</option>
                            <option value="Pending">Pending</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div>
                        <label>End Date</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>
            </Card>

            {/* Attendance Records List */}
            <Card>
                <h3 className="mb-lg">Records ({filteredData.length})</h3>

                {filteredData.length === 0 ? (
                    <p className="text-muted text-center p-xl">No records found</p>
                ) : (
                    <ul className="history-list">
                        {filteredData.map((record) => (
                            <li key={record.attendanceId} className="history-item hover-lift">
                                <div>
                                    <div className="font-bold text-lg">
                                        {new Date(record.date).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="text-muted text-sm mt-xs">
                                        {record.type} {record.siteName ? `• ${record.siteName}` : ''}
                                    </div>
                                    <div className="text-muted text-xs mt-xs">
                                        Marked: {new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <StatusBadge status={record.status} size="sm" />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <style>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    gap: var(--spacing-md);
                }
                .filter-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--spacing-md);
                }
                .text-xs { font-size: 0.75rem; }
                .mb-xs { margin-bottom: var(--spacing-xs); }
                .text-2xl { font-size: 1.5rem; font-weight: 700; margin-bottom: 0; }
                .text-accent { color: var(--accent); }
                .text-error { color: var(--secondary); }
                .text-primary { color: var(--primary); }
                .font-bold { font-weight: 600; }
                .text-right { text-align: right; }
            `}</style>
        </div>
    );
};

export default MyAttendance;
