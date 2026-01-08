import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { LeaveBalance, LeaveRequest } from '../types/types';
import LeaveStatsCard from '../components/LeaveStatsCard';
import LeaveApplicationModal from '../components/LeaveApplicationModal';
import { Plus, ArrowLeft, CalendarX } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LeaveDashboard() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<LeaveBalance>({ pl: 0, ol: 0, el: 0, lwp: 0 });
    const [history, setHistory] = useState<LeaveRequest[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // 1. Listen to Balance
        const balRef = ref(database, `employees/${user.uid}/leaveBalance`);
        const unsubBal = onValue(balRef, (snap) => {
            if (snap.exists()) setBalance(snap.val());
            else setBalance({ pl: 17, ol: 4, el: 0, lwp: 0 }); // Default for new users?
            setLoading(false);
        });

        // 2. Listen to History
        const histRef = ref(database, `leaves/${user.uid}`);
        const unsubHist = onValue(histRef, (snap) => {
            if (snap.exists()) {
                const list = Object.values(snap.val()) as LeaveRequest[];
                setHistory(list.sort((a, b) => b.appliedAt - a.appliedAt));
            } else {
                setHistory([]);
            }
        });

        return () => { unsubBal(); unsubHist(); };
    }, [user]);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading leave data...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8">
            {/* Nav */}
            <div className="flex items-center justify-between max-w-5xl mx-auto">
                <Link to="/employee/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                </Link>
                <h1 className="text-xl font-bold text-slate-800">My Leaves</h1>
            </div>

            <div className="max-w-5xl mx-auto space-y-8">
                {/* Stats */}
                <LeaveStatsCard balance={balance} />

                {/* Action */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Apply for New Leave
                </button>

                {/* History List */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="font-bold text-slate-700">Leave History</h3>
                    </div>
                    {history.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <CalendarX className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No leave history found.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {history.map((req) => (
                                <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm
                                            ${req.type === 'LWP' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                            {req.type}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{req.days} Days</div>
                                            <div className="text-xs text-slate-500 font-mono">
                                                {new Date(req.from).toLocaleDateString()} - {new Date(req.to).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize 
                                            ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                req.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                                    req.status === 'cancelled' ? 'bg-slate-100 text-slate-500' :
                                                        'bg-amber-100 text-amber-700'}`}>
                                            {req.status}
                                        </span>
                                        {req.status === 'pending' && (
                                            <div className="mt-1">
                                                <button className="text-xs text-rose-500 hover:underline">Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {user && (
                <LeaveApplicationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    uid={user.uid}
                    balance={balance}
                    onSuccess={() => {/* Toast or refresh handled by listener */ }}
                />
            )}
        </div>
    );
}
