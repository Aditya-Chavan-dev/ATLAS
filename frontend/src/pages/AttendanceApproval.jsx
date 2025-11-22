import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPendingApprovals, approveAttendance, rejectAttendance } from '../services/attendanceService';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from '../utils/toast';
import '../styles/ManagerStyles.css';

/**
 * Formats ISO timestamp to 12-hour format with AM/PM
 * @param {string} isoString - ISO 8601 timestamp
 * @returns {string} - Formatted time (e.g., "9:02 PM")
 */
const formatTime12Hour = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * AttendanceApproval Page
 * Allows Managers/MD to review, approve, or reject pending attendance requests.
 */
const AttendanceApproval = () => {
    const { currentUser } = useAuth();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchPendingApprovals();

        // Auto-refresh every 5 seconds for real-time updates
        const interval = setInterval(() => {
            fetchPendingApprovals();
        }, 5000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    /**
     * Fetches pending attendance requests from the backend.
     */
    const fetchPendingApprovals = async () => {
        try {
            setLoading(true);
            const data = await getPendingApprovals();
            // Ensure we work with an array
            const requests = Array.isArray(data) ? data : [];
            setPendingRequests(requests);
        } catch (error) {
            console.error('Error fetching pending approvals:', error);
            toast.error('Failed to load pending approvals');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Approves an attendance request.
     */
    const handleApprove = async (attendanceId) => {
        try {
            setProcessingId(attendanceId);
            await approveAttendance(attendanceId, currentUser.uid);
            toast.success('Attendance approved');

            // Optimistically remove from list
            setPendingRequests(prev => prev.filter(req => req.attendanceId !== attendanceId));
        } catch (error) {
            console.error('Error approving:', error);
            toast.error('Failed to approve attendance');
        } finally {
            setProcessingId(null);
        }
    };

    /**
     * Rejects an attendance request.
     */
    const handleReject = async (attendanceId) => {
        if (!window.confirm('Are you sure you want to reject this attendance?')) return;

        try {
            setProcessingId(attendanceId);
            await rejectAttendance(attendanceId, currentUser.uid);
            toast.success('Attendance rejected');

            // Optimistically remove from list
            setPendingRequests(prev => prev.filter(req => req.attendanceId !== attendanceId));
        } catch (error) {
            console.error('Error rejecting:', error);
            toast.error('Failed to reject attendance');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return <LoadingSpinner fullPage message="Loading pending approvals..." />;
    }

    return (
        <div className="manager-dashboard fade-in">
            <div className="mb-xl">
                <h1 className="gradient-text text-3xl font-bold mb-sm">Pending Approvals</h1>
                <p className="text-muted">
                    Review and approve employee attendance requests
                </p>
            </div>

            {pendingRequests.length === 0 ? (
                <Card>
                    <div className="text-center p-xl">
                        <span className="text-4xl block mb-md">✅</span>
                        <h3 className="text-xl font-bold mb-sm">All Caught Up!</h3>
                        <p className="text-muted">
                            No pending attendance requests to review.
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="flex-col gap-md">
                    {pendingRequests.map((request) => (
                        <Card key={request.attendanceId} className="hover-lift">
                            <div className="approval-card-content">
                                {/* Employee Info */}
                                <div className="flex-1 min-w-200">
                                    <div className="flex items-center gap-sm mb-xs">
                                        <h3 className="font-bold text-lg m-0">{request.employeeName}</h3>
                                        {request.isEdited && (
                                            <span className="badge-warning">Edited</span>
                                        )}
                                    </div>
                                    <p className="text-muted text-sm mb-sm">
                                        {request.employeeEmail}
                                    </p>

                                    <div className="flex gap-md text-sm">
                                        <div>
                                            <span className="text-muted">📅 Date: </span>
                                            <span className="font-medium">{request.date}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted">🕐 Time: </span>
                                            <span className="font-medium">
                                                {formatTime12Hour(request.markedAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Attendance Details */}
                                <div className="details-box flex-1 min-w-200">
                                    <div className="mb-xs">
                                        <span className="text-muted text-xs">Location</span>
                                        <div className="font-bold">
                                            {request.type === 'Office' ? '🏢 Office' : `🏗️ Site: ${request.siteName}`}
                                        </div>
                                    </div>

                                    {/* Show Original Data if Edited */}
                                    {request.isEdited && request.originalData && (
                                        <div className="mt-sm text-xs text-muted italic">
                                            Original: {request.originalData.type}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="action-btn-group">
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => handleApprove(request.attendanceId)}
                                        disabled={processingId === request.attendanceId}
                                    >
                                        {processingId === request.attendanceId ? '...' : 'Approve'}
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleReject(request.attendanceId)}
                                        disabled={processingId === request.attendanceId}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <style>{`
                .text-3xl { font-size: 1.875rem; }
                .text-4xl { font-size: 2.25rem; }
                .text-xl { font-size: 1.25rem; }
                .text-lg { font-size: 1.125rem; }
                .text-sm { font-size: 0.875rem; }
                .text-xs { font-size: 0.75rem; }
                
                .font-bold { font-weight: 700; }
                .font-medium { font-weight: 500; }
                
                .text-center { text-align: center; }
                .text-muted { color: var(--text-muted); }
                
                .mb-xs { margin-bottom: var(--spacing-xs); }
                .mb-sm { margin-bottom: var(--spacing-sm); }
                .mb-md { margin-bottom: var(--spacing-md); }
                .mb-xl { margin-bottom: var(--spacing-xl); }
                .mt-sm { margin-top: var(--spacing-sm); }
                .m-0 { margin: 0; }
                
                .p-xl { padding: var(--spacing-xl); }
                
                .flex { display: flex; }
                .flex-col { display: flex; flexDirection: column; }
                .flex-1 { flex: 1; }
                .items-center { align-items: center; }
                .gap-sm { gap: var(--spacing-sm); }
                .gap-md { gap: var(--spacing-md); }
                
                .min-w-200 { min-width: 200px; }
                
                .approval-card-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: var(--spacing-md);
                }
                
                .badge-warning {
                    font-size: 12px;
                    background: rgba(245, 158, 11, 0.1);
                    color: var(--warning);
                    padding: 2px 8px;
                    border-radius: 12px;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                }
                
                .details-box {
                    background: rgba(255, 255, 255, 0.03);
                    padding: var(--spacing-sm);
                    border-radius: var(--radius-sm);
                }
                
                .action-btn-group {
                    display: flex;
                    gap: var(--spacing-sm);
                    min-width: 150px;
                    justify-content: flex-end;
                }
            `}</style>
        </div>
    );
};

export default AttendanceApproval;
