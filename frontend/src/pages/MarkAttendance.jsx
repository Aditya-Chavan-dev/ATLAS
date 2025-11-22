import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { markAttendance, getTodayAttendance, editAttendance } from '../services/attendanceService';
import Button from '../components/Button';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from '../utils/toast';
import '../styles/EmployeeStyles.css';

/**
 * MarkAttendance Page
 * Allows employees to mark their daily attendance (Office/Site).
 * Also allows editing attendance if status is 'Pending'.
 */
const MarkAttendance = () => {
    const { currentUser } = useAuth();

    // State Management
    const [selectedType, setSelectedType] = useState('Office');
    const [siteName, setSiteName] = useState('');
    const [loading, setLoading] = useState(false);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [fetchingStatus, setFetchingStatus] = useState(true);

    // Fetch attendance status on component mount
    useEffect(() => {
        fetchTodayAttendance();
    }, []);

    /**
     * Fetches today's attendance status from the backend.
     */
    const fetchTodayAttendance = async () => {
        try {
            setFetchingStatus(true);
            if (currentUser?.uid) {
                const response = await getTodayAttendance(currentUser.uid);
                // API returns { success: true, data: { ... } } or just data depending on service wrapper
                // Based on service, it returns response.data directly.
                // Let's assume the service returns the data object directly or null.
                setTodayAttendance(response?.data || null);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setFetchingStatus(false);
        }
    };

    /**
     * Handles selection of attendance type (Office/Site).
     * Resets site name if 'Office' is selected.
     */
    const handleTypeSelect = (type) => {
        setSelectedType(type);
        if (type === 'Office') {
            setSiteName('');
        }
    };

    /**
     * Submits the attendance data to the backend.
     * Handles both new attendance marking and editing existing attendance.
     */
    const handleMarkAttendance = async () => {
        // Validation: Site name is required for 'Site' type
        if (selectedType === 'Site' && !siteName.trim()) {
            toast.error('Please enter site name');
            return;
        }

        try {
            setLoading(true);

            const attendanceData = {
                employeeId: currentUser?.uid,
                employeeName: currentUser?.displayName || currentUser?.email,
                type: selectedType,
                siteName: selectedType === 'Site' ? siteName.trim() : null,
            };

            if (isEditing && todayAttendance) {
                // Update existing attendance
                await editAttendance(todayAttendance.attendanceId, attendanceData);
                toast.success('Attendance updated! Pending MD approval');
            } else {
                // Create new attendance record
                await markAttendance(attendanceData);
                toast.success('Attendance marked! Pending MD approval');
            }

            // Refresh status to show updated state
            await fetchTodayAttendance();
            setIsEditing(false);

        } catch (error) {
            console.error('Error marking attendance:', error);
            toast.error(error.message || 'Failed to mark attendance');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Enables edit mode, populating fields with existing data.
     */
    const handleEditClick = () => {
        if (todayAttendance) {
            setSelectedType(todayAttendance.type);
            setSiteName(todayAttendance.siteName || '');
            setIsEditing(true);
        }
    };

    /**
     * Cancels edit mode and resets form.
     */
    const handleCancelEdit = () => {
        setIsEditing(false);
        setSelectedType('Office');
        setSiteName('');
    };

    if (fetchingStatus) {
        return <LoadingSpinner fullPage message="Loading attendance status..." />;
    }

    // VIEW: Already Marked Attendance (Read-Only View)
    // Show this only if attendance exists, not editing, and status is NOT Rejected
    if (todayAttendance && !isEditing && todayAttendance.status !== 'Rejected') {
        return (
            <div className="employee-container fade-in">
                <div className="attendance-card">
                    <h2 className="mb-lg">✅ Attendance Marked</h2>

                    <div className="glass-card p-lg mb-lg text-center">
                        <div className="mb-md">
                            <span className="text-muted text-sm">Type</span>
                            <div className="text-xl font-bold mt-sm">{todayAttendance.type}</div>
                        </div>

                        {todayAttendance.siteName && (
                            <div className="mb-md">
                                <span className="text-muted text-sm">Site Name</span>
                                <div className="text-lg font-medium mt-sm">{todayAttendance.siteName}</div>
                            </div>
                        )}

                        <div className="mt-lg">
                            <StatusBadge status={todayAttendance.status} />
                        </div>

                        {todayAttendance.isEdited && (
                            <div className="mt-md p-sm bg-warning-light rounded text-warning text-sm">
                                ✏️ This attendance has been edited
                            </div>
                        )}
                    </div>

                    {todayAttendance.status === 'Pending' && (
                        <Button variant="outline" onClick={handleEditClick} className="w-full">
                            ✏️ Edit Attendance
                        </Button>
                    )}

                    {todayAttendance.status === 'Approved' && (
                        <p className="text-success text-sm mt-md">
                            ✅ Your attendance has been approved by MD
                        </p>
                    )}

                    {todayAttendance.status === 'Rejected' && (
                        <p className="text-error text-sm mt-md">
                            ❌ Your attendance was rejected. Please contact MD.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // VIEW: Mark Attendance Form (Create/Edit)
    return (
        <div className="employee-container fade-in">
            <div className="attendance-card">
                <h2 className="mb-sm">
                    {isEditing ? '✏️ Edit Your Attendance' : '📍 Mark Your Attendance'}
                </h2>
                <p className="text-muted mb-xl">
                    {isEditing ? 'Update your attendance details' : 'Select where you are working today'}
                </p>

                {/* Type Selection Grid */}
                <div className="grid-2-cols gap-md mb-xl">
                    <button
                        onClick={() => handleTypeSelect('Office')}
                        className={`type-selector ${selectedType === 'Office' ? 'active' : ''}`}
                    >
                        <span className="text-4xl">🏢</span>
                        <span>Office</span>
                    </button>

                    <button
                        onClick={() => handleTypeSelect('Site')}
                        className={`type-selector ${selectedType === 'Site' ? 'active' : ''}`}
                    >
                        <span className="text-4xl">🏗️</span>
                        <span>Site</span>
                    </button>
                </div>

                {/* Conditional Site Name Input */}
                {selectedType === 'Site' && (
                    <div className="mb-xl fade-in">
                        <label className="text-left block mb-sm text-muted text-sm">Site Name *</label>
                        <input
                            type="text"
                            value={siteName}
                            onChange={(e) => setSiteName(e.target.value)}
                            placeholder="Enter site name (e.g., Construction Site A)"
                            className="input-field"
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="action-buttons">
                    {isEditing && (
                        <Button variant="outline" onClick={handleCancelEdit} disabled={loading}>
                            Cancel
                        </Button>
                    )}
                    <Button variant="primary" onClick={handleMarkAttendance} disabled={loading}>
                        {loading ? <LoadingSpinner size="sm" /> : (isEditing ? 'Update Attendance' : 'Mark Attendance')}
                    </Button>
                </div>

                {isEditing && (
                    <p className="text-warning text-sm mt-md">
                        ⚠️ Editing will require MD approval again
                    </p>
                )}
            </div>

            {/* Inline styles for specific component needs not covered by global css */}
            <style>{`
                .grid-2-cols {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                }
                .type-selector {
                    padding: var(--spacing-xl);
                    border-radius: var(--radius-md);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    font-size: 1.125rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--spacing-sm);
                }
                .type-selector:hover {
                    transform: translateY(-2px);
                    background: rgba(255, 255, 255, 0.1);
                }
                .type-selector.active {
                    border-color: var(--primary);
                    background: rgba(99, 102, 241, 0.2);
                }
                .w-full { width: 100%; }
                .text-xl { font-size: 1.25rem; }
                .text-lg { font-size: 1.125rem; }
                .text-sm { font-size: 0.875rem; }
                .text-4xl { font-size: 2.25rem; }
                .font-bold { font-weight: 700; }
                .font-medium { font-weight: 500; }
                .text-muted { color: var(--text-muted); }
                .text-success { color: var(--accent); }
                .text-error { color: var(--secondary); }
                .text-warning { color: #f59e0b; }
                .bg-warning-light { background: rgba(245, 158, 11, 0.1); }
                .rounded { border-radius: var(--radius-sm); }
                .mb-sm { margin-bottom: var(--spacing-sm); }
                .mb-md { margin-bottom: var(--spacing-md); }
                .mb-lg { margin-bottom: var(--spacing-lg); }
                .mb-xl { margin-bottom: var(--spacing-xl); }
                .mt-sm { margin-top: var(--spacing-sm); }
                .mt-md { margin-top: var(--spacing-md); }
                .mt-lg { margin-top: var(--spacing-lg); }
            `}</style>
        </div>
    );
};

export default MarkAttendance;
