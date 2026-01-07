import { useState } from 'react';
import { X } from 'lucide-react';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    employeeName: string;
}

export default function RejectionModal({ isOpen, onClose, onSubmit, employeeName }: RejectionModalProps) {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason.trim()) return;
        onSubmit(reason);
        setReason('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-red-50 p-6 flex items-center justify-between border-b border-red-100">
                    <div>
                        <h2 className="text-xl font-bold text-red-900">Reject Attendance</h2>
                        <p className="text-sm text-red-700">For {employeeName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-red-500" />
                    </button>
                </div>

                <div className="p-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rejection Reason</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Wrong site selected, not at location..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none h-32 resize-none"
                        autoFocus
                    />
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reason.trim()}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all"
                    >
                        Confirm Rejection
                    </button>
                </div>
            </div>
        </div>
    );
}
