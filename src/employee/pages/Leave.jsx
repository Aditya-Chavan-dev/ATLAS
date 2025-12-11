import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CalendarDaysIcon,
    BoltIcon
} from '@heroicons/react/24/outline'
import { formatDate, getTodayString } from '../../utils/dateUtils'
import RefinedModal from '../../components/ui/RefinedModal'
import { ref, onValue, push, set, remove } from 'firebase/database'
import { database } from '../../firebase/config'
import ApiService from '../../services/api'

export default function EmployeeLeave() {
    const { currentUser, userProfile } = useAuth()
    const [activeTab, setActiveTab] = useState('apply') // 'apply' or 'status'
    const [leaveType, setLeaveType] = useState('Casual Leave')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [reason, setReason] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [leaveRequests, setLeaveRequests] = useState([])
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' })

    // Quick Action Helper
    // ... existing quick action logic ...
    const applyQuickLeave = (type, dateOffset = 0) => {
        const d = new Date();
        d.setDate(d.getDate() + dateOffset);
        const dateStr = d.toISOString().split('T')[0];

        setLeaveType(type);
        setStartDate(dateStr);
        setEndDate(dateStr);
        setReason('Quick Apply');

        // Open confirmation modal
        setModalConfig({
            isOpen: true,
            title: 'Quick Apply Confirmation',
            message: `Apply for ${type} on ${dateStr}?`,
            type: 'info',
            primaryAction: {
                label: 'Confirm Apply',
                onClick: () => {
                    closeModal();
                    submitLeave({ type, startDate: dateStr, endDate: dateStr, reason: 'Quick Apply' });
                }
            },
            secondaryAction: {
                label: 'Cancel',
                onClick: closeModal
            }
        });
    };

    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const showMessage = (title, message, type = 'info') => {
        setModalConfig({ isOpen: true, title, message, type, primaryAction: null, secondaryAction: null });
    };

    // Fetch History (Realtime)
    useEffect(() => {
        if (!currentUser) return;
        const leavesRef = ref(database, `leaves/${currentUser.uid}`);
        const unsubscribe = onValue(leavesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedLeaves = Object.values(data).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
                setLeaveRequests(loadedLeaves);
            } else {
                setLeaveRequests([]);
            }
        });
        return () => unsubscribe();
    }, [currentUser]);

    const calculateLeaveDays = (start, end) => {
        if (!start || !end) return 0;
        const startD = new Date(start);
        const endD = new Date(end);
        const diffTime = endD - startD;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const submitLeave = async (payload = null) => {
        const type = payload?.type || leaveType;
        const from = payload?.startDate || startDate;
        const to = payload?.endDate || endDate;
        const rsn = payload?.reason || reason;

        if (!from || !to) {
            showMessage('Error', 'Please select start and end dates', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // Attempt to use Backend API first
            try {
                await ApiService.post('/api/leave/apply', {
                    employeeId: currentUser.uid,
                    employeeName: userProfile?.name || currentUser.email,
                    type: type === 'Casual Leave' ? 'CL' : 'SL',
                    from,
                    to,
                    reason: rsn
                });
                showMessage('Success', 'Leave request submitted via server!', 'success');
            } catch (apiError) {
                console.warn('API submission failed, falling back to direct Firebase write:', apiError);

                // Fallback: Direct Firebase Write (Client-side)
                // This ensures functionality even if the backend is down/missing
                const leavesRef = ref(database, `leaves/${currentUser.uid}`);
                const newLeaveRef = push(leavesRef);
                const leaveId = newLeaveRef.key;

                const leaveData = {
                    leaveId,
                    employeeId: currentUser.uid,
                    employeeName: userProfile?.name || currentUser.email,
                    employeeEmail: currentUser.email,
                    type: type === 'Casual Leave' ? 'CL' : 'SL',
                    from,
                    to,
                    reason: rsn,
                    status: 'pending',
                    appliedAt: new Date().toISOString(),
                    totalDays: calculateLeaveDays(from, to)
                };

                await set(newLeaveRef, leaveData);
                showMessage('Success', 'Leave request submitted successfully!', 'success');
            }

            // Reset form
            setStartDate('');
            setEndDate('');
            setReason('');
            setActiveTab('status');
        } catch (error) {
            showMessage('Submission Failed', error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        submitLeave();
    };

    const handleCancel = async (leaveId) => {
        if (!confirm('Are you sure you want to cancel this leave request?')) return;

        try {
            const leavesRef = ref(database, `leaves/${currentUser.uid}/${leaveId}`);
            await remove(leavesRef);
            showMessage('Cancelled', 'Leave request cancelled.', 'success');
        } catch (error) {
            showMessage('Error', error.message, 'error');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Leave Management</h2>
                    <p className="text-slate-500 mt-1">Manage your leaves and approvals</p>
                </div>
                <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => setActiveTab('apply')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'apply' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Apply
                    </button>
                    <button
                        onClick={() => setActiveTab('status')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'status' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {activeTab === 'apply' && (
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button onClick={() => applyQuickLeave('Casual Leave', 0)} className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors text-left group">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-white transition-colors">
                                    <BoltIcon className="w-5 h-5" />
                                </span>
                                <span className="font-semibold text-indigo-900">CL Today</span>
                            </div>
                            <p className="text-xs text-indigo-600/80">Apply Casual Leave for today</p>
                        </button>
                        <button onClick={() => applyQuickLeave('Sick Leave', 0)} className="p-4 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors text-left group">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="p-2 bg-rose-100 text-rose-600 rounded-lg group-hover:bg-white transition-colors">
                                    <BoltIcon className="w-5 h-5" />
                                </span>
                                <span className="font-semibold text-rose-900">SL Today</span>
                            </div>
                            <p className="text-xs text-rose-600/80">Apply Sick Leave for today</p>
                        </button>
                        <button onClick={() => applyQuickLeave('Casual Leave', 1)} className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors text-left group">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-white transition-colors">
                                    <CalendarDaysIcon className="w-5 h-5" />
                                </span>
                                <span className="font-semibold text-emerald-900">CL Tomorrow</span>
                            </div>
                            <p className="text-xs text-emerald-600/80">Apply Casual Leave for tomorrow</p>
                        </button>
                    </div>

                    {/* Custom Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <CalendarDaysIcon className="w-5 h-5 text-slate-400" />
                            Custom Request
                        </h3>
                        <form onSubmit={handleFormSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                                <select
                                    value={leaveType}
                                    onChange={(e) => setLeaveType(e.target.value)}
                                    className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                >
                                    <option>Casual Leave</option>
                                    <option>Sick Leave</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={getTodayString()}
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={startDate || getTodayString()}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                    />
                                </div>
                            </div>

                            {startDate && endDate && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 flex items-center justify-between">
                                    <span>Total Duration</span>
                                    <span className="font-bold text-indigo-600">{calculateLeaveDays(startDate, endDate)} Days</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Reason (Optional)</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Brief reason for leave..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.99] disabled:opacity-70"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'status' && (
                <div className="space-y-4">
                    {leaveRequests.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
                            <ClockIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No leave history found</p>
                        </div>
                    ) : (
                        leaveRequests.map((req) => (
                            <div key={req.leaveId} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                                        ${req.status === 'approved' ? 'bg-green-100 text-green-600' :
                                            req.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                                req.status === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                                                    req.status === 'auto-blocked' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-yellow-100 text-yellow-600'}`}>
                                        {req.status === 'approved' ? <CheckCircleIcon className="w-5 h-5" /> :
                                            req.status === 'rejected' ? <XCircleIcon className="w-5 h-5" /> :
                                                req.status === 'auto-blocked' ? <ExclamationTriangleIcon className="w-5 h-5" /> :
                                                    <ClockIcon className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800">{req.type}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase
                                                ${req.status === 'approved' ? 'bg-green-50 text-green-700' :
                                                    req.status === 'rejected' ? 'bg-red-50 text-red-700' :
                                                        req.status === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                                                            req.status === 'auto-blocked' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-yellow-50 text-yellow-700'}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {formatDate(req.from)} — {formatDate(req.to)} ({req.totalDays} days)
                                        </div>
                                        {req.reason && <p className="text-sm text-slate-400 mt-1">"{req.reason}"</p>}
                                        {req.conflictNotes && <p className="text-xs text-orange-600 mt-1 font-medium">{req.conflictNotes}</p>}
                                    </div>
                                </div>
                                {req.status === 'pending' && (
                                    <button
                                        onClick={() => handleCancel(req.leaveId)}
                                        className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel Request
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            <RefinedModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                primaryAction={modalConfig.primaryAction}
                secondaryAction={modalConfig.secondaryAction}
            />
        </div>
    )
}
