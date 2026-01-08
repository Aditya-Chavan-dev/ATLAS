import { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, Info } from 'lucide-react';
import { LEAVE_TYPES, LeaveType } from '../types/leaveConstants';
import { calculateLeaveDays, applyForLeave } from '../services/leaveService';
import { LeaveBalance } from '../types/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    uid: string;
    balance: LeaveBalance;
    onSuccess: () => void;
}

export default function LeaveApplicationModal({ isOpen, onClose, uid, balance, onSuccess }: Props) {
    const [type, setType] = useState<LeaveType>(LEAVE_TYPES.PL);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [calculatedDays, setCalculatedDays] = useState(0);
    const [error, setError] = useState('');

    // Derived State
    const currentBalance = balance[type.toLowerCase() as keyof LeaveBalance] || 0;
    const isInsufficient = calculatedDays > currentBalance;
    // But wait, if Type is LWP, balance check is irrelevant (it's a counter)
    const isLWP = type === LEAVE_TYPES.LWP;

    // Effect: Calculate Days when dates change
    useEffect(() => {
        if (from && to) {
            const days = calculateLeaveDays(from, to);
            setCalculatedDays(days);
        } else {
            setCalculatedDays(0);
        }
    }, [from, to]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (calculatedDays <= 0) throw new Error("Please select valid dates (must include working days).");

            // Block normal types if insufficient
            if (!isLWP && isInsufficient) {
                throw new Error(`Insufficient ${type} Balance. Please use 'Request Additional Leave' (LWP) if urgently needed.`);
            }

            await applyForLeave(uid, {
                uid,
                type,
                from,
                to,
                days: calculatedDays,
                reason
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        Apply for Leave
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Type Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Type</label>
                        <div className="grid grid-cols-4 gap-2">
                            {(Object.values(LEAVE_TYPES) as LeaveType[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`py-2 rounded-lg text-sm font-bold border transition-all ${type === t
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        {/* Dynamic Hint */}
                        <div className="text-xs flex justify-between items-center px-1">
                            <span className="text-slate-400">Balance:</span>
                            <span className={`font-bold ${isLWP ? 'text-amber-600' : (currentBalance > 0 ? 'text-emerald-600' : 'text-rose-500')}`}>
                                {isLWP ? 'Unlimited (Salary Deducted)' : `${currentBalance} Days`}
                            </span>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">From</label>
                            <input
                                type="date"
                                required
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">To</label>
                            <input
                                type="date"
                                required
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                            />
                        </div>
                    </div>

                    {/* Sandwich Warning / Calculation */}
                    {calculatedDays > 0 && (
                        <div className={`p-3 rounded-lg border flex items-start gap-3 text-sm ${!isLWP && isInsufficient
                            ? 'bg-rose-50 border-rose-100 text-rose-700'
                            : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                            }`}>
                            {!isLWP && isInsufficient ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <Info className="w-5 h-5 shrink-0" />}
                            <div>
                                <p className="font-bold">Total Duration: {calculatedDays} Days</p>
                                <p className="text-xs opacity-90 mt-0.5">
                                    {(!isLWP && isInsufficient)
                                        ? "Exceeds available balance. Switch to 'LWP' to proceed."
                                        : "Includes working days only (Holidays excluded)."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Reason</label>
                        <textarea
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Why do you need this leave?"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                        />
                    </div>

                    {/* Submit */}
                    {error && <div className="text-xs text-rose-500 font-bold bg-rose-50 p-2 rounded-lg text-center">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading || (!isLWP && isInsufficient)}
                        className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${loading || (!isLWP && isInsufficient)
                            ? 'bg-slate-300 cursor-not-allowed shadow-none'
                            : (isLWP ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200')
                            }`}
                    >
                        {loading ? 'Submitting...' : isLWP ? 'Request Unpaid Leave' : 'Submit Application'}
                    </button>

                    {/* LWP Switch Hint */}
                    {(!isLWP && isInsufficient) && (
                        <button
                            type="button"
                            onClick={() => setType(LEAVE_TYPES.LWP)}
                            className="w-full text-xs text-indigo-600 font-bold hover:underline text-center"
                        >
                            Need more days? Switch to LWP &rarr;
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
