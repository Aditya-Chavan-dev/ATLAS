import { useState } from 'react';
import { X, Building2, MapPin } from 'lucide-react';

interface AttendanceRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { type: 'office' | 'site'; siteName?: string }) => void;
    loading: boolean;
}

export default function AttendanceRequestModal({ isOpen, onClose, onSubmit, loading }: AttendanceRequestModalProps) {
    const [type, setType] = useState<'office' | 'site'>('office');
    const [siteName, setSiteName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (type === 'site' && !siteName.trim()) return;
        onSubmit({ type, siteName: type === 'office' ? undefined : siteName });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-50 p-6 flex items-center justify-between border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Mark Attendance</h2>
                        <p className="text-sm text-slate-500">Select your work location today</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Location Type Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setType('office')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all
                                ${type === 'office'
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                }
                            `}
                        >
                            <Building2 className="w-8 h-8" />
                            <span className="font-bold">Office</span>
                        </button>

                        <button
                            onClick={() => setType('site')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all
                                ${type === 'site'
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                }
                            `}
                        >
                            <MapPin className="w-8 h-8" />
                            <span className="font-bold">Site</span>
                        </button>
                    </div>

                    {/* Site Name Input (Conditional) */}
                    {type === 'site' && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Site Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                                placeholder="e.g. Project Alpha, Sector 45"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || (type === 'site' && !siteName.trim())}
                        className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending...
                            </>
                        ) : (
                            'Confirm Request'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
