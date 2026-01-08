import { useState } from 'react';
import { useManageAttendance } from '../hooks/useManageAttendance';
import RejectionModal from '@/features/owner/components/RejectionModal'; // Reuse for now or move
import { CheckCircle, Clock, MapPin, Building2, Undo2 } from 'lucide-react';

import { AttendanceRecord, AttendanceStatus } from '@/types/attendance';

// Local alias if needed to match existing code usage, or just refactor usage
type AttendanceRequest = AttendanceRecord;

export default function MDDashboard() {
    const { requests, loading, updateStatus: commitUpdate } = useManageAttendance();
    const [selectedRequest, setSelectedRequest] = useState<AttendanceRequest | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    // Wrapper to handle UI feedback if needed, although hook handles basics
    const handleStatusUpdate = async (uid: string, status: typeof AttendanceStatus['APPROVED'] | typeof AttendanceStatus['REJECTED'], reason?: string) => {
        try {
            await commitUpdate(uid, status, reason);
        } catch (e) {
            alert("Action failed. Please try again.");
        }
    };

    const handleReject = (reason: string) => {
        if (selectedRequest) {
            handleStatusUpdate(selectedRequest.uid, AttendanceStatus.REJECTED, reason);
            setIsRejectModalOpen(false);
            setSelectedRequest(null);
        }
    };

    const pendingRequests = requests.filter(r => r.status === AttendanceStatus.PENDING);
    const approvedRequests = requests.filter(r => r.status === AttendanceStatus.APPROVED);

    if (loading) return <div className="p-8 text-slate-400">Loading dashboard...</div>;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">MD Portal</h1>
                    <p className="text-slate-500">Manage daily attendance approvals</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-100 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {pendingRequests.length} Pending
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {approvedRequests.length} Active
                    </div>
                </div>
            </div>

            {/* Pending Queue */}
            {pendingRequests.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Pending Requests
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingRequests.map((req) => (
                            <div key={req.uid} className="bg-white p-5 rounded-2xl border border-amber-100 shadow-lg shadow-amber-500/5 hover:shadow-amber-500/10 transition-all flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                        {req.photoURL ? <img src={req.photoURL} className="w-full h-full object-cover" /> : <div className="text-slate-400 text-xs">IMG</div>}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{req.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            {req.type === 'office' ? <Building2 className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                            {req.type === 'office' ? 'Office' : req.siteName}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-auto pt-2">
                                    <button
                                        onClick={() => { setSelectedRequest(req); setIsRejectModalOpen(true); }}
                                        className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition-colors text-sm"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(req.uid, AttendanceStatus.APPROVED)}
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md shadow-emerald-500/20 transition-all text-sm"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Approved List */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-700">Today's Attendance</h2>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                            <tr>
                                <th className="p-4">Employee</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Time</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {approvedRequests.map((req) => (
                                <tr key={req.uid} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-700 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                                            {req.photoURL && <img src={req.photoURL} className="w-full h-full object-cover" />}
                                        </div>
                                        {req.name}
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${req.type === 'office' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-purple-50 border-purple-100 text-purple-700'
                                            }`}>
                                            {req.type === 'office' ? <Building2 className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                            {req.type === 'office' ? 'Office' : req.siteName}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 font-mono">
                                        {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleStatusUpdate(req.uid, AttendanceStatus.REJECTED, 'Revoked by MD')}
                                            className="text-slate-400 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-lg"
                                            title="Revoke Approval"
                                        >
                                            <Undo2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {approvedRequests.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                                        No approved attendance yet today.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <RejectionModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onSubmit={handleReject}
                employeeName={selectedRequest?.name || 'Employee'}
            />
        </div>
    );
}
