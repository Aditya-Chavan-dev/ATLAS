import { useState, useEffect } from 'react';
import { useAuth, useUserProfile } from '@/features/auth';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { LeaveBalance, LeaveRequest } from '../types/types';
import { LEAVE_TYPES, LeaveType } from '../types/leaveConstants';
import { applyForLeave } from '../services/leaveService';
import { differenceInDays } from 'date-fns';
import { Calendar, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LeaveDashboard() {
    const { user } = useAuth();
    const { profile } = useUserProfile();

    // Data State
    const [balance, setBalance] = useState<LeaveBalance>({ cl: 0, sl: 0, el: 0, lwp: 0 });
    const [history, setHistory] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [type, setType] = useState<LeaveType>(LEAVE_TYPES.CL);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [reason, setReason] = useState(''); // Optional for minimal flow, but usually required
    const [submitting, setSubmitting] = useState(false);
    const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Load Data
    useEffect(() => {
        if (!user) return;

        // Balance Listener
        const unsubBal = onValue(ref(database, `employees/${user.uid}/leaveBalance`), (snap) => {
            setBalance(snap.exists() ? snap.val() : { cl: 0, sl: 0, el: 0, lwp: 0 });
            setLoading(false);
        });

        // History Listener
        const unsubHist = onValue(ref(database, `leaves/${user.uid}`), (snap) => {
            if (snap.exists()) {
                const list = Object.values(snap.val()) as LeaveRequest[];
                setHistory(list.sort((a, b) => b.appliedAt - a.appliedAt));
            } else {
                setHistory([]);
            }
        });

        return () => { unsubBal(); unsubHist(); };
    }, [user]);

    // Handle Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setFormMsg(null);
        setSubmitting(true);

        try {
            const days = differenceInDays(new Date(to), new Date(from)) + 1;
            if (days <= 0) throw new Error("End date must be after start date");

            const currentBal = balance[type.toLowerCase() as keyof LeaveBalance];
            if (type !== 'LWP' && days > currentBal) {
                throw new Error(`Insufficient ${type} balance. Available: ${currentBal}`);
            }

            await applyForLeave(profile?.name || 'Employee', {
                uid: user.uid,
                type,
                from,
                to,
                days,
                reason: reason || 'Mobile Application'
            });

            setFormMsg({ type: 'success', text: 'Application Submitted!' });
            // Reset Form
            setReason('');
            setFrom('');
            setTo('');
        } catch (err: any) {
            setFormMsg({ type: 'error', text: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-700';
            case 'rejected': return 'bg-rose-100 text-rose-700';
            default: return 'bg-amber-100 text-amber-700';
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* 1. Header */}
            <div className="bg-white p-4 sticky top-0 z-10 border-b border-slate-100 flex items-center gap-3">
                <Link to="/employee/dashboard" className="p-2 -ml-2 text-slate-400">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-slate-900">Leave Center</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* 2. Balance Strip */}
                <div className="grid grid-cols-4 gap-2">
                    <BalancePill label="CL" val={balance.cl} color="bg-blue-50 text-blue-700 border-blue-100" />
                    <BalancePill label="SL" val={balance.sl} color="bg-rose-50 text-rose-700 border-rose-100" />
                    <BalancePill label="EL" val={balance.el} color="bg-purple-50 text-purple-700 border-purple-100" />
                    <BalancePill label="LWP" val={balance.lwp} color="bg-amber-50 text-amber-700 border-amber-100" />
                </div>

                {/* 3. Embedded Application Form */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-brand-600" />
                        New Application
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Type Selector */}
                        <div className="grid grid-cols-4 gap-2">
                            {['CL', 'SL', 'EL', 'LWP'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t as LeaveType)}
                                    className={`py-2 rounded-lg text-sm font-bold border transition-all ${type === t
                                        ? 'bg-brand-600 text-white border-brand-600 shadow-md transform scale-105'
                                        : 'bg-slate-50 text-slate-500 border-slate-200'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Dates Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">From</label>
                                <input
                                    type="date"
                                    required
                                    value={from}
                                    onChange={e => setFrom(e.target.value)}
                                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all font-medium text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">To</label>
                                <input
                                    type="date"
                                    required
                                    value={to}
                                    onChange={e => setTo(e.target.value)}
                                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all font-medium text-sm"
                                />
                            </div>
                        </div>

                        {/* Reason */}
                        <input
                            placeholder="Reason (Optional)"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full p-3 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all font-medium text-sm"
                        />

                        {/* Feedback Message */}
                        {formMsg && (
                            <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${formMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                {formMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {formMsg.text}
                            </div>
                        )}

                        {/* Action */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 bg-brand-600 active:bg-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-200 disabled:opacity-50 transition-all"
                        >
                            {submitting ? 'Sending...' : 'Submit Request'}
                        </button>
                    </form>
                </div>

                {/* 4. Recent History */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">Recent Requests</h3>
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">No history found</div>
                    ) : (
                        history.slice(0, 10).map(req => (
                            <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${req.type === 'LWP' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                            {req.type}
                                        </span>
                                        <span className="text-sm font-bold text-slate-800">{req.days} Days</span>
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium">
                                        {new Date(req.from).toLocaleDateString()} - {new Date(req.to).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(req.status)}`}>
                                    {req.status}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function BalancePill({ label, val, color }: { label: string, val: number, color: string }) {
    return (
        <div className={`flex flex-col items-center justify-center p-2 rounded-xl border ${color}`}>
            <span className="text-lg font-black">{val}</span>
            <span className="text-[10px] font-bold opacity-80">{label}</span>
        </div>
    );
}
