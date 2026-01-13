import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { ExtendedLeaveRequest } from '@/features/leave/types/types';
import { approveLeave, rejectLeave } from '@/features/leave/services/leaveService';
import { useAuth } from '@/features/auth'; // Using auth hook instead of store if store is gone
import { ArrowLeft, CheckCircle, XCircle, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MDLeaveApprovals() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<ExtendedLeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch ALL leaves (This is heavy read, ideally assume MD role access everything or index/query)
        // With current rules, 'leaves' node is user-keyed. We need to fetch root `leaves/` and flatten.

        const leavesRef = ref(database, 'leaves');
        const unsub = onValue(leavesRef, (snapshot) => {
            if (snapshot.exists()) {
                const allData = snapshot.val();
                const flatList: ExtendedLeaveRequest[] = [];

                // FlatMap logic + Fetch User Profile Names? 
                // For now, we just rely on leaf data. 
                // Wait, we need names. We should fetch 'employees' to map names.
                // Optimization: Fetch employees once.

                // Let's implement basic flow first.
                Object.keys(allData).forEach(uid => {
                    const userLeaves = allData[uid];
                    Object.values(userLeaves).forEach((leave: any) => {
                        if (leave.status === 'pending') {
                            flatList.push({ ...leave, uid });
                        }
                    });
                });
                setRequests(flatList.sort((a, b) => a.appliedAt - b.appliedAt));
            } else {
                setRequests([]);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Helper to fetch names (Basic Effect)
    const [userMap, setUserMap] = useState<Record<string, string>>({});
    useEffect(() => {
        const empRef = ref(database, 'employees');
        onValue(empRef, (snap) => {
            if (snap.exists()) {
                const map: Record<string, string> = {};
                const data = snap.val();
                Object.keys(data).forEach(uid => {
                    map[uid] = data[uid].profile?.name || 'Unknown';
                });
                setUserMap(map);
            }
        }, { onlyOnce: true });
    }, []);

    const handleApprove = async (req: ExtendedLeaveRequest) => {
        if (!user) return;
        try {
            await approveLeave(user.uid, req);
        } catch (e) {
            alert("Approval Failed: " + e);
        }
    };

    const handleReject = async (req: ExtendedLeaveRequest) => {
        if (!user) return;
        const reason = prompt("Enter Rejection Reason:");
        if (!reason) return;
        try {
            await rejectLeave(user.uid, req, reason);
        } catch (e) {
            alert("Rejection Failed: " + e);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading requests...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
                <Link to="/md" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium">
                    <ArrowLeft className="w-5 h-5" />
                    Back to MD Portal
                </Link>
                <h1 className="text-xl font-bold text-slate-800">Leave Approvals</h1>
            </div>

            <div className="max-w-5xl mx-auto space-y-4">
                {requests.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400 shadow-sm">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20 text-emerald-500" />
                        <p>All caught up! No pending leave requests.</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
                            {/* User Info */}
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{userMap[req.uid] || 'Loading...'}</h3>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-mono">{req.type}</span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {new Date(req.from).toLocaleDateString()} - {new Date(req.to).toLocaleDateString()}
                                    <span className="ml-2 bg-slate-100 px-2 rounded-full text-xs font-bold text-slate-500">{req.days} Days</span>
                                </div>
                                <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                    "{req.reason}"
                                </p>
                                {req.type === 'LWP' && (
                                    <div className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                        ⚠️ Unpaid Leave Request
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex md:flex-col gap-2 justify-center min-w-[120px]">
                                <button
                                    onClick={() => handleApprove(req)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl font-bold shadow-sm shadow-emerald-200 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                                <button
                                    onClick={() => handleReject(req)}
                                    className="flex-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 py-2 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <XCircle className="w-4 h-4" /> Reject
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
