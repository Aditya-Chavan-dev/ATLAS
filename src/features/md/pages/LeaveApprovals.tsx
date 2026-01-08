import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { database } from '@/lib/firebase/config';
import { ref, get, onValue } from 'firebase/database';
import { CheckCircle, Calendar } from 'lucide-react';
import { LeaveRecord, approveLeave, rejectLeave } from '@/features/leave/services/leaveService';

interface ExtendedLeaveRecord extends LeaveRecord {
    userName?: string;
    userEmail?: string;
}

export default function LeaveApprovals() {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<ExtendedLeaveRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        // Fetch all leaves
        // Note: In a large app, we'd query by status="pending".
        // Here we fetch 'leaves' root and filter client-side for simplicity/speed (assuming <1000 active leaves).
        const leavesRef = ref(database, 'leaves');

        const unsub = onValue(leavesRef, async (snapshot) => {
            if (!snapshot.exists()) {
                setLeaves([]);
                setLoading(false);
                return;
            }

            const data = snapshot.val();
            const pending: ExtendedLeaveRecord[] = [];

            // Flatten structure: leaves/{uid}/{leaveId}
            for (const [uid, userLeaves] of Object.entries(data)) {
                if (!userLeaves) continue;

                // Fetch user profile for name (Optimization: Cache this or fetch in parallel)
                // For now, simple fetch per user
                let userName = 'Unknown';
                let userEmail = '';
                try {
                    const profileSnap = await get(ref(database, `users/${uid}`));
                    const profile = profileSnap.val();
                    userName = profile?.displayName || 'Unknown';
                    userEmail = profile?.email || '';
                } catch (e) { /* ignore */ }

                Object.values(userLeaves as any).forEach((leave: any) => {
                    if (leave.status === 'pending') {
                        pending.push({ ...leave, userName, userEmail });
                    }
                });
            }

            // Sort by Date (Oldest first)
            pending.sort((a, b) => a.appliedAt - b.appliedAt);
            setLeaves(pending);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const handleApprove = async (leave: ExtendedLeaveRecord) => {
        if (!user || processingId) return;
        if (!confirm(`Approve ${leave.type} for ${leave.userName}? This will deduct ${leave.totalDays} days.`)) return;

        setProcessingId(leave.id);
        try {
            await approveLeave(user.uid, leave);
        } catch (err: any) {
            alert(`Approval Failed: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (leave: ExtendedLeaveRecord) => {
        if (!user || processingId) return;
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        setProcessingId(leave.id);
        try {
            await rejectLeave(user.uid, leave, reason);
        } catch (err: any) {
            alert(`Rejection Failed: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                    <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Leave Requests</h1>
                    <p className="text-slate-500 text-sm">Review and approve applications</p>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-400">Loading requests...</div>
            ) : leaves.length === 0 ? (
                <div className="bg-slate-50 rounded-3xl p-8 text-center border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-sm text-slate-300">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="text-slate-900 font-bold mb-1">All Caught Up!</div>
                    <div className="text-slate-500 text-sm">No pending leave requests found.</div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {leaves.map(leave => (
                        <div key={leave.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center">

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-slate-900">{leave.userName}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${leave.type === 'PL' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>
                                        {leave.type}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-500 flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}
                                    </span>
                                    <span className="font-semibold text-slate-700">
                                        ({leave.totalDays} Days)
                                    </span>
                                </div>
                                <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg inline-block">
                                    "{leave.reason}"
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => handleReject(leave)}
                                    disabled={!!processingId}
                                    className="flex-1 md:flex-none py-2 px-4 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 font-bold transition-colors text-sm"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleApprove(leave)}
                                    disabled={!!processingId}
                                    className="flex-1 md:flex-none py-2 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold transition-colors text-sm shadow-lg shadow-slate-200"
                                >
                                    {processingId === leave.id ? 'Processing...' : 'Approve'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
