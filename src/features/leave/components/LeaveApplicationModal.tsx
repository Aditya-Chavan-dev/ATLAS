import { useState, useEffect } from 'react';
import { X, AlertTriangle, Calculator } from 'lucide-react';
import { applyForLeave, calculateLeaveDays } from '../services/leaveService';
import { useAuth } from '@/features/auth';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    balance: { pl: number, co: number };
}

export function LeaveApplicationModal({ isOpen, onClose, balance }: Props) {
    const { user } = useAuth();
    const [type, setType] = useState<'PL' | 'CO'>('PL');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [estimatedDays, setEstimatedDays] = useState(0);

    // Calculate days whenever dates change
    useEffect(() => {
        if (from && to) {
            if (new Date(from) > new Date(to)) {
                setEstimatedDays(0);
            } else {
                setEstimatedDays(calculateLeaveDays(from, to));
            }
        } else {
            setEstimatedDays(0);
        }
    }, [from, to]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setError('');

        try {
            await applyForLeave(user.uid, null, { type, from, to, reason });
            onClose();
            // Reset form
            setFrom('');
            setTo('');
            setReason('');
            setEstimatedDays(0);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Apply for Leave</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setType('PL')}
                            className={`p-3 rounded-xl border font-bold text-sm transition-all ${type === 'PL'
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            Privilege Leave (PL)
                            <div className="text-xs font-normal opacity-75 mt-1">Bal: {balance.pl}</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('CO')}
                            className={`p-3 rounded-xl border font-bold text-sm transition-all ${type === 'CO'
                                ? 'bg-purple-50 border-purple-500 text-purple-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            Comp Off (CO)
                            <div className="text-xs font-normal opacity-75 mt-1">Bal: {balance.co}</div>
                        </button>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">From</label>
                            <input
                                type="date"
                                required
                                value={from}
                                onChange={e => setFrom(e.target.value)}
                                className="w-full p-3 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 transition-colors font-medium text-slate-800"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">To</label>
                            <input
                                type="date"
                                required
                                value={to}
                                onChange={e => setTo(e.target.value)}
                                className="w-full p-3 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 transition-colors font-medium text-slate-800"
                            />
                        </div>
                    </div>

                    {/* Calculation Preview */}
                    {estimatedDays > 0 ? (
                        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl flex items-center gap-2 text-sm font-bold">
                            <Calculator className="w-4 h-4" />
                            Total: {estimatedDays} Days (Sundays/Holidays Excl.)
                        </div>
                    ) : (
                        <div className="bg-slate-50 text-slate-400 p-3 rounded-xl flex items-center gap-2 text-sm">
                            <Calculator className="w-4 h-4" />
                            Select dates to see count
                        </div>
                    )}

                    {/* Reason */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Reason</label>
                        <textarea
                            required
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 transition-colors font-medium text-slate-800 resize-none"
                            placeholder="Why do you need leave?"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Request'}
                    </button>
                </form>
            </div>
        </div>
    );
}
