import { dateUtils } from '@/utils/dateUtils';
import { useState, useEffect } from 'react';
import { useEmployeeStats } from '../hooks/useEmployeeStats';
import { useMarkAttendance } from '../hooks/useMarkAttendance';
import { AttendanceStatus } from '@/types/attendance';
import AttendanceRequestModal from '../components/AttendanceRequestModal';
import { Clock, CalendarDays, CheckCircle, XCircle, MapPin } from 'lucide-react';

export default function EmployeeDashboard() {
    const { stats, loading, todayStatus } = useEmployeeStats();
    const { submitRequest, loading: marking, status: markStatus, message } = useMarkAttendance();
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleRequest = (data: { type: 'office' | 'site'; siteName?: string }) => {
        submitRequest(data).then(() => {
            setIsModalOpen(false);
        });
    };

    if (loading) return <div className="p-8 text-slate-400">Loading...</div>;

    const statusObj = todayStatus.status; // 'pending' | 'approved' | 'rejected' | null

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header with Live Time */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Welcome back, Employee</p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-2xl font-mono font-bold text-slate-700">
                        {dateUtils.formatISTTime(currentTime)}
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                        {dateUtils.formatISTDate(currentTime)}
                    </div>
                </div>
            </div>

            {/* Hero Action Card */}
            <div className={`
                rounded-2xl shadow-lg overflow-hidden border transition-all relative
                ${statusObj === 'approved' ? 'bg-emerald-50 border-emerald-100' :
                    statusObj === 'rejected' ? 'bg-red-50 border-red-100' :
                        statusObj === 'pending' ? 'bg-amber-50 border-amber-100' :
                            'bg-white border-slate-100 shadow-slate-200/50'}
            `}>
                <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6">
                    {/* Icon Status */}
                    <div className={`
                        w-24 h-24 rounded-full flex items-center justify-center shadow-inner
                        ${statusObj === AttendanceStatus.APPROVED ? 'bg-emerald-100 text-emerald-600' :
                            statusObj === AttendanceStatus.REJECTED ? 'bg-red-100 text-red-600' :
                                statusObj === AttendanceStatus.PENDING ? 'bg-amber-100 text-amber-600' :
                                    'bg-indigo-50 text-indigo-600'}
                    `}>
                        {statusObj === AttendanceStatus.APPROVED ? <CheckCircle className="w-10 h-10" /> :
                            statusObj === AttendanceStatus.REJECTED ? <XCircle className="w-10 h-10" /> :
                                statusObj === AttendanceStatus.PENDING ? <Clock className="w-10 h-10 animate-pulse" /> :
                                    <Clock className="w-10 h-10" />}
                    </div>

                    {/* Text Status */}
                    <div className="max-w-md mx-auto">
                        <h2 className={`text-3xl font-bold ${statusObj === 'approved' ? 'text-emerald-800' :
                            statusObj === 'rejected' ? 'text-red-800' :
                                statusObj === 'pending' ? 'text-amber-800' :
                                    'text-slate-800'
                            }`}>
                            {statusObj === AttendanceStatus.APPROVED ? "You are Present" :
                                statusObj === AttendanceStatus.REJECTED ? "Attendance Rejected" :
                                    statusObj === AttendanceStatus.PENDING ? "Attendance sent for approval" :
                                        "Mark Attendance"}
                        </h2>

                        <p className={`mt-2 font-medium ${statusObj === 'approved' ? 'text-emerald-600' :
                            statusObj === 'rejected' ? 'text-red-600' :
                                statusObj === 'pending' ? 'text-amber-700' :
                                    'text-slate-500'
                            }`}>
                            {statusObj === 'approved' ? "Great job! Your attendance is approved." :
                                statusObj === 'rejected' ? `Reason: ${todayStatus.rejectionReason || 'Contact Admin'}` :
                                    statusObj === 'pending' ? "Status: Pending" :
                                        "Please confirm your location to start the day."}
                        </p>
                    </div>

                    {/* Action Button */}
                    {(statusObj === null || statusObj === 'rejected') && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className={`
                                relative overflow-hidden group px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl
                                ${statusObj === 'rejected'
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'}
                            `}
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                {statusObj === 'rejected' ? 'Try Again' : 'Mark Present'}
                                <span className="text-white/60">→</span>
                            </span>
                        </button>
                    )}

                    {message && (
                        <div className={`mt-4 text-sm font-medium ${markStatus === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={CalendarDays} label="Days Present" value={stats.daysAttended} color="text-blue-600" bg="bg-blue-50" />
                <StatCard
                    icon={MapPin}
                    label="Current Status"
                    value={statusObj ? statusObj.toUpperCase() : 'AWAY'}
                    color={statusObj === 'approved' ? 'text-emerald-600' : statusObj === 'pending' ? 'text-amber-600' : statusObj === 'rejected' ? 'text-red-600' : 'text-slate-400'}
                    bg={statusObj === 'approved' ? 'bg-emerald-50' : statusObj === 'pending' ? 'bg-amber-50' : statusObj === 'rejected' ? 'bg-red-50' : 'bg-slate-50'}
                />
            </div>

            {/* Modal */}
            <AttendanceRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleRequest}
                loading={marking}
            />
        </div>
    );
}

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    bg: string;
}

function StatCard({ icon: Icon, label, value, color, bg }: StatCardProps) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-3">
                <div className={`self-start p-2.5 rounded-xl ${bg} ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-2xl font-bold text-slate-800 tracking-tight">{value}</div>
                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">{label}</div>
                </div>
            </div>
        </div>
    );
}
