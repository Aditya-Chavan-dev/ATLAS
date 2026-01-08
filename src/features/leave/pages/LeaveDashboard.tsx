import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { database } from '@/lib/firebase/config';
import { ref, onValue } from 'firebase/database';
import { Plus, Clock, CheckCircle, XCircle, AlertOctagon, Trash2 } from 'lucide-react';
import { LeaveApplicationModal } from '../components/LeaveApplicationModal';
import { LeaveRecord, cancelLeave } from '../services/leaveService';

export default function LeaveDashboard() {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [balance, setBalance] = useState({ pl: 0, co: 0 });
    const [history, setHistory] = useState<LeaveRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Listen to Balance
        const balRef = ref(database, `employees/${user.uid}/leaveBalance`);
        const unsubBal = onValue(balRef, (snap) => {
            setBalance(snap.val() || { pl: 17, co: 0 });
        });

        // Listen to History
        const histRef = ref(database, `leaves/${user.uid}`);
        const unsubHist = onValue(histRef, (snap) => {
            const data = snap.val();
            if (data) {
                const arr = Object.values(data) as LeaveRecord[];
                // Sort by appliedAt desc
                arr.sort((a, b) => b.appliedAt - a.appliedAt);
                setHistory(arr);
            } else {
                setHistory([]);
            }
            setLoading(false);
        });

        return () => {
            unsubBal();
            unsubHist();
        };
    }, [user]);

    const handleCancel = async (leaveId: string) => {
        if (!user || !window.confirm("Are you sure you want to cancel this request?")) return;
        try {
            await cancelLeave(user.uid, leaveId, "User Cancelled");
            // State updates automatically via listener
        } catch (err: any) {
            alert("Failed to cancel: " + err.message);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'approved': return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3 h-3" /> Approved</span>;
            case 'rejected': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold"><XCircle className="w-3 h-3" /> Rejected</span>;
            case 'pending': return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold"><Clock className="w-3 h-3" /> Pending</span>;
            case 'auto-blocked': return <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs font-bold"><AlertOctagon className="w-3 h-3" /> Blocked</span>;
            case 'cancelled': return <span className="flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-1 rounded text-xs font-bold"><XCircle className="w-3 h-3" /> Cancelled</span>;
            default: return <span className="text-slate-400 text-xs capitalize">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Leave Portal</h1>
                    <p className="text-slate-500 text-sm">Manage your time off</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900 text-white p-3 rounded-full hover:bg-slate-800 transition-colors shadow-lg"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-200">
                    <div className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">PL Balance</div>
                    <div className="text-3xl font-bold">{balance.pl}</div>
                    <div className="text-indigo-200 text-xs mt-1">Paid Leaves</div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">CO Balance</div>
                    <div className="text-3xl font-bold text-slate-800">{balance.co}</div>
                    <div className="text-slate-400 text-xs mt-1">Comp Offs</div>
                </div>
            </div>

            {/* History List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Request History
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading...</div>
                ) : history.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No leave history found</div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {history.map(record => (
                            <div key={record.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    {/* ... Left Side ... */}
                                    <div>
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            {record.type} Request
                                            <span className="text-xs font-normal text-slate-400">
                                                ({record.totalDays} days)
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {new Date(record.from).toLocaleDateString()} - {new Date(record.to).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* ... Right Side (Badge + Actions) ... */}
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={record.status} />
                                        {record.status === 'pending' && (
                                            <button
                                                onClick={() => handleCancel(record.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                title="Cancel Request"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    "{record.reason}"
                                </div>
                                {record.rejectionReason && (
                                    <div className="mt-2 text-xs text-red-600 font-medium flex gap-1">
                                        <AlertOctagon className="w-3 h-3" />
                                        {record.rejectionReason}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <LeaveApplicationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} balance={balance} />
        </div>
    );
}
