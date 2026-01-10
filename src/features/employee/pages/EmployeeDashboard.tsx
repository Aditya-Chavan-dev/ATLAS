import { dateUtils } from '@/utils/dateUtils';
import { useState, useEffect } from 'react';
import { useEmployeeStats } from '../hooks/useEmployeeStats';
import { useMarkAttendance } from '../hooks/useMarkAttendance';
import { AttendanceStatus } from '@/types/attendance';
import AttendanceRequestModal from '../components/AttendanceRequestModal';
import { Clock, CalendarDays, CheckCircle, XCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        <div className="space-y-8 max-w-7xl mx-auto">
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
                rounded-2xl shadow-sm overflow-hidden border transition-all relative
                ${statusObj === 'approved' ? 'bg-white border-emerald-200 shadow-emerald-500/0' :
                    statusObj === 'rejected' ? 'bg-white border-red-200 shadow-red-500/0' :
                        statusObj === 'pending' ? 'bg-white border-amber-200 shadow-amber-500/0' :
                            'bg-white border-slate-200'}
            `}>
                <div className="p-8 md:p-10 flex flex-col items-center justify-center text-center space-y-6">
                    {/* Icon Status */}
                    <div className={`
                        w-20 h-20 rounded-2xl flex items-center justify-center
                        ${statusObj === AttendanceStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/50' :
                            statusObj === AttendanceStatus.REJECTED ? 'bg-rose-50 text-rose-600 ring-4 ring-rose-50/50' :
                                statusObj === AttendanceStatus.PENDING ? 'bg-amber-50 text-amber-600 ring-4 ring-amber-50/50' :
                                    'bg-brand-50 text-brand-600 ring-4 ring-brand-50/50'}
                    `}>
                        {statusObj === AttendanceStatus.APPROVED ? <CheckCircle className="w-8 h-8" /> :
                            statusObj === AttendanceStatus.REJECTED ? <XCircle className="w-8 h-8" /> :
                                statusObj === AttendanceStatus.PENDING ? <Clock className="w-8 h-8 animate-pulse" /> :
                                    <Clock className="w-8 h-8" />}
                    </div>

                    {/* Text Status */}
                    <div className="max-w-md mx-auto">
                        <h2 className="text-2xl font-bold text-slate-900">
                            {statusObj === AttendanceStatus.APPROVED ? "You are Present" :
                                statusObj === AttendanceStatus.REJECTED ? "Attendance Rejected" :
                                    statusObj === AttendanceStatus.PENDING ? "Attendance Pending" :
                                        "Mark Attendance"}
                        </h2>

                        <div className="mt-2 inline-flex items-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                                ${statusObj === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                                    statusObj === 'rejected' ? 'bg-rose-50 text-rose-700' :
                                        statusObj === 'pending' ? 'bg-amber-50 text-amber-700' :
                                            'bg-slate-100 text-slate-600'}
                            `}>
                                {statusObj === 'approved' ? "Approved" :
                                    statusObj === 'rejected' ? `Rejected: ${todayStatus.rejectionReason || 'Contact Admin'}` :
                                        statusObj === 'pending' ? "Awaiting Approval" :
                                            "Not Started"}
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    {(statusObj === null || statusObj === 'rejected') && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className={`
                                relative overflow-hidden group px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm
                                ${statusObj === 'rejected'
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                                    : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-200'}
                            `}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {statusObj === 'rejected' ? 'Try Again' : 'Mark Present'}
                                <span className="opacity-80">→</span>
                            </span>
                        </button>
                    )}

                    {message && (
                        <div className={`mt-4 text-sm font-medium ${markStatus === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={CalendarDays} label="Days Present" value={stats.daysAttended} color="text-blue-600" bg="bg-blue-50" />

                {/* Leave Button */}
                <Link to="/employee/leave" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer block">
                    <div className="flex flex-col gap-3">
                        <div className="self-start p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                            <span className="text-xl">✈️</span>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-800 tracking-tight">Manage Leaves</div>
                            <div className="text-xs text-slate-500 font-medium mt-1">Apply & Check Balance</div>
                        </div>
                    </div>
                </Link>

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
