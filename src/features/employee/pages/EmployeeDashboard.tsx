import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { useEmployeeStats } from '../hooks/useEmployeeStats';
import { useLeaveBalance } from '@/features/leave/hooks/useLeaveBalance';
import { useMarkAttendance } from '../hooks/useMarkAttendance';
import { dateUtils } from '@/utils/dateUtils';
import { MapPin, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const { todayStatus, stats: attendanceStats } = useEmployeeStats();
    const { balance } = useLeaveBalance(user?.uid);
    const { submitRequest, loading: marking, message: markMsg, status: markStatus } = useMarkAttendance();

    // Live Clock State
    const [now, setNow] = useState(new Date());

    // Location State
    const [isSelecting, setIsSelecting] = useState(false);
    const [locationType, setLocationType] = useState<'office' | 'site'>('office');
    const [siteName, setSiteName] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleInitialClick = () => {
        if (todayStatus.status) return;
        setIsSelecting(true);
    };

    const handleConfirmAttendance = () => {
        if (locationType === 'site' && !siteName.trim()) {
            alert('Please enter the Site Name');
            return;
        }

        submitRequest({
            type: locationType,
            siteName: locationType === 'site' ? siteName : undefined
        }).then(() => {
            // We rely on the hook's success to eventually update 'todayStatus'
            // But valid submission should close the modal
            if (!markStatus || markStatus !== 'error') {
                setIsSelecting(false);
            }
        });
    };

    // Auto-close modal on success from hook (if message is success and we are selecting)
    useEffect(() => {
        if (markStatus === 'success') {
            setIsSelecting(false);
        }
    }, [markStatus]);

    const isMarked = !!todayStatus.status;
    const isApproved = todayStatus.status === 'approved';
    const isRejected = todayStatus.status === 'rejected';

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] space-y-8 pb-8 relative">
            {/* 1. Header & Live Clock */}
            <header className={`flex flex-col items-center justify-center pt-8 space-y-2 transition-all duration-300 ${isSelecting ? 'opacity-20 blur-sm scale-95' : 'opacity-100 scale-100'}`}>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight font-mono">
                    {dateUtils.formatISTTime(now.getTime())}
                </h1>
                <p className="text-slate-500 font-medium text-lg uppercase tracking-wider">
                    {dateUtils.formatISTDate(now.getTime())}
                </p>
                <div className="text-sm font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                    Good Afternoon, {user?.displayName?.split(' ')[0]}
                </div>
            </header>

            {/* 2. Primary Action Area (Thumb Zone) */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-sm mx-auto space-y-6">
                {!isMarked ? (
                    <>
                        {/* HERO BUTTON - CLEAN - NO TOGGLES */}
                        <button
                            onClick={handleInitialClick}
                            className={`
                                w-64 h-64 rounded-full flex flex-col items-center justify-center gap-4
                                text-white shadow-2xl transition-all duration-300
                                ${isSelecting
                                    ? 'scale-90 opacity-20 blur-sm bg-slate-400 cursor-default'
                                    : 'bg-gradient-to-br from-brand-600 to-indigo-700 shadow-brand-200 hover:scale-105 active:scale-95 cursor-pointer'}
                            `}
                        >
                            <MapPin className="w-12 h-12" />
                            <span className="text-2xl font-bold tracking-tight">MARK IN</span>
                            <span className="text-xs opacity-80 font-medium uppercase tracking-widest">Tap to Punch</span>
                        </button>
                    </>
                ) : (
                    <div className={`
                        w-full p-6 rounded-3xl border-2 flex flex-col items-center text-center space-y-3
                        ${isApproved ? 'bg-emerald-50 border-emerald-100' :
                            isRejected ? 'bg-rose-50 border-rose-100' :
                                'bg-amber-50 border-amber-100'}
                    `}>
                        {isApproved ? <CheckCircle className="w-12 h-12 text-emerald-500" /> :
                            isRejected ? <AlertCircle className="w-12 h-12 text-rose-500" /> :
                                <Clock className="w-12 h-12 text-amber-500 animate-pulse" />}

                        <div>
                            <h2 className={`text-xl font-bold ${isApproved ? 'text-emerald-900' :
                                isRejected ? 'text-rose-900' :
                                    'text-amber-900'
                                }`}>
                                {isApproved ? 'You are Present' :
                                    isRejected ? 'Attendance Rejected' :
                                        'Request Pending'}
                            </h2>
                            <p className="text-slate-500 font-medium">
                                {isRejected ? (todayStatus.rejectionReason || 'Contact Manager') :
                                    todayStatus.timestamp ? `Clocked at ${new Date(todayStatus.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                                        'Waiting for approval...'}
                            </p>
                            {todayStatus.siteName && (
                                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/50 border border-black/5 text-xs font-bold text-slate-600">
                                    <MapPin className="w-3 h-3" />
                                    {todayStatus.siteName}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Stats Grid (4 Boxes) - Blur when selecting */}
            <div className={`grid grid-cols-2 gap-4 px-4 w-full max-w-sm mx-auto transition-all duration-300 ${isSelecting ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
                <StatBox label="Days Present" value={attendanceStats.daysAttended} color="text-slate-900" bg="bg-white" />
                <StatBox label="Casual Leave" value={balance.cl} color="text-blue-600" bg="bg-blue-50/50" />
                <StatBox label="Sick Leave" value={balance.sl} color="text-rose-600" bg="bg-rose-50/50" />
                <StatBox label="Earned Leave" value={balance.el} color="text-purple-600" bg="bg-purple-50/50" />
            </div>

            {/* LOCATION BOTTOM SHEET OVERLAY */}
            {isSelecting && !isMarked && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                        onClick={() => setIsSelecting(false)}
                    />

                    {/* Sheet Content */}
                    <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300 mx-auto">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

                        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Confirm Location</h2>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => setLocationType('office')}
                                className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${locationType === 'office'
                                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-lg scale-105 ring-2 ring-brand-500/20'
                                        : 'border-slate-100 bg-slate-50 text-slate-400 grayscale hover:grayscale-0'
                                    }`}
                            >
                                <div className="p-3 bg-white rounded-xl shadow-sm text-brand-600">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <span className="font-bold text-sm">Office HQ</span>
                            </button>

                            <button
                                onClick={() => setLocationType('site')}
                                className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${locationType === 'site'
                                        ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg scale-105 ring-2 ring-orange-500/20'
                                        : 'border-slate-100 bg-slate-50 text-slate-400 grayscale hover:grayscale-0'
                                    }`}
                            >
                                <div className="p-3 bg-white rounded-xl shadow-sm text-orange-600">
                                    <MapPin className="w-8 h-8" />
                                </div>
                                <span className="font-bold text-sm">Remote Site</span>
                            </button>
                        </div>

                        {locationType === 'site' && (
                            <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">Site Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Project Alpha"
                                    value={siteName}
                                    onChange={(e) => setSiteName(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-orange-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                    autoFocus
                                />
                            </div>
                        )}

                        <button
                            onClick={handleConfirmAttendance}
                            disabled={marking}
                            className={`w-full py-4 rounded-xl text-lg font-bold text-white shadow-xl transition-all active:scale-95 ${marking ? 'bg-slate-400 cursor-not-allowed' :
                                    locationType === 'site' ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-200' :
                                        'bg-gradient-to-r from-brand-600 to-indigo-600 shadow-brand-200'
                                }`}
                        >
                            {marking ? 'Confirming...' : 'Confirm Punch'}
                        </button>
                    </div>
                </div>
            )}

            {/* ERROR TOAST (Global Z-Index High) */}
            {markMsg && !isMarked && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[60] bg-white/90 backdrop-blur-md text-slate-900 font-bold px-6 py-3 rounded-full shadow-2xl border border-slate-200 animate-in slide-in-from-top-5 flex items-center gap-2">
                    {markStatus === 'error' ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    <span className={markStatus === 'error' ? 'text-rose-600' : 'text-emerald-600'}>{markMsg}</span>
                </div>
            )}
        </div>
    );
}

function StatBox({ label, value, color, bg }: { label: string; value: string | number; color: string; bg: string }) {
    return (
        <div className={`${bg} border border-slate-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm`}>
            <span className={`text-3xl font-black ${color} tracking-tight`}>{value}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</span>
        </div>
    );
}
