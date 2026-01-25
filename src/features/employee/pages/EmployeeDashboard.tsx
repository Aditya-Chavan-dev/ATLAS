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
    const [locationType, setLocationType] = useState<'office' | 'site'>('office');
    const [siteName, setSiteName] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleMarkAttendance = () => {
        // Strict Mobile: No modals if possible, just direct action or simple confirm
        if (todayStatus.status) return; // Prevent double tap

        if (locationType === 'site' && !siteName.trim()) {
            alert('Please enter the Site Name');
            return;
        }

        submitRequest({
            type: locationType,
            siteName: locationType === 'site' ? siteName : undefined
        });
    };

    const isMarked = !!todayStatus.status;
    const isApproved = todayStatus.status === 'approved';
    const isRejected = todayStatus.status === 'rejected';

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] space-y-8 pb-8">
            {/* 1. Header & Live Clock */}
            <header className="flex flex-col items-center justify-center pt-8 space-y-2">
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
                        {/* Location Toggle - Only show if not marked */}
                        <div className="w-full flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                            <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
                                <button
                                    onClick={() => setLocationType('office')}
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${locationType === 'office' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                                >
                                    Office HQ
                                </button>
                                <button
                                    onClick={() => setLocationType('site')}
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${locationType === 'site' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    Remote Site
                                </button>
                            </div>

                            {locationType === 'site' && (
                                <input
                                    type="text"
                                    placeholder="Enter Site Name (e.g. Site A)"
                                    value={siteName}
                                    onChange={(e) => setSiteName(e.target.value)}
                                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl font-medium text-slate-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                    autoFocus
                                />
                            )}
                        </div>

                        <button
                            onClick={handleMarkAttendance}
                            disabled={marking}
                            className={`
                                w-64 h-64 rounded-full flex flex-col items-center justify-center gap-4
                                text-white shadow-2xl 
                                active:scale-95 transition-transform touch-manipulation
                                ${marking ? 'opacity-80 animate-pulse bg-slate-400 shadow-slate-200' : 'hover:scale-105 bg-brand-600 shadow-brand-200'}
                            `}
                        >
                            <MapPin className="w-12 h-12" />
                            <span className="text-2xl font-bold tracking-tight">
                                {marking ? 'Marking...' : 'MARK IN'}
                            </span>
                            <span className="text-xs opacity-80 font-medium uppercase tracking-widest">
                                {locationType === 'office' ? 'At Office HQ' : 'At Site'}
                            </span>
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

                {/* Error/Success Toast Message inline */}
                {markMsg && !isMarked && (
                    <div className={`mt-4 text-sm font-bold ${markStatus === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {markMsg}
                    </div>
                )}
            </div>

            {/* 3. Stats Grid (4 Boxes) */}
            <div className="grid grid-cols-2 gap-4 px-4 w-full max-w-sm mx-auto">
                <StatBox label="Days Present" value={attendanceStats.daysAttended} color="text-slate-900" bg="bg-white" />
                <StatBox label="Casual Leave" value={balance.cl} color="text-blue-600" bg="bg-blue-50/50" />
                <StatBox label="Sick Leave" value={balance.sl} color="text-rose-600" bg="bg-rose-50/50" />
                <StatBox label="Earned Leave" value={balance.el} color="text-purple-600" bg="bg-purple-50/50" />
            </div>
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
