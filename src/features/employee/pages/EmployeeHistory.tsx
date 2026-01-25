import { useState, useMemo } from 'react';
import { useAttendanceHistory } from '../hooks/useAttendanceHistory';
import { ChevronLeft, ChevronRight, Clock, MapPin, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function EmployeeHistory() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { history, loading } = useAttendanceHistory(currentDate);

    // Navigation
    const prevMonth = () => {
        const d = new Date(currentDate);
        d.setMonth(d.getMonth() - 1);
        setCurrentDate(d);
    };

    const nextMonth = () => {
        const d = new Date(currentDate);
        const today = new Date();
        if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) return;
        d.setMonth(d.getMonth() + 1);
        setCurrentDate(d);
    };

    const isCurrentMonth = () => {
        const today = new Date();
        return currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    };

    // Filter to only show days with records (skip 'absent' filler if hook returns it, depending on hook logic)
    // The hook in useAttendanceHistory likely returns all days. For a 'List View', we usually only want
    // Present/Rejected/Pending days, OR we show absent days as 'Absent'.
    // Let's filter to only "Interesting" days for the list to keep it clean, 
    // OR show all working days. 
    // User requested "Transparency", so showing Absent days is good, but maybe dense.
    // Let's stick to the hook's output but reverse order (Latest Date First).

    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [history]);

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-24 space-y-6">
            {/* Header / Month Switcher */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 sticky top-4 z-10 flex items-center justify-between">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attendance Log</span>
                    <span className="text-lg font-bold text-slate-900">
                        {format(currentDate, 'MMMM yyyy')}
                    </span>
                </div>

                <button
                    onClick={nextMonth}
                    disabled={isCurrentMonth()}
                    className={`p-2 rounded-xl transition-colors ${isCurrentMonth() ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-400'}`}
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10 text-slate-400 animate-pulse">Loading history...</div>
            ) : sortedHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                    <Calendar className="w-12 h-12 opacity-20" />
                    <p>No records found for this month.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedHistory.map((record) => (
                        <div
                            key={record.date}
                            className={`
                                relative overflow-hidden rounded-2xl p-4 border transition-all
                                ${record.status === 'approved' ? 'bg-white border-slate-100 shadow-sm' :
                                    record.status === 'rejected' ? 'bg-rose-50 border-rose-100' :
                                        record.status === 'pending' ? 'bg-amber-50 border-amber-100' :
                                            'bg-slate-50 border-transparent opacity-60'} 
                            `}
                        >
                            <div className="flex justify-between items-start">
                                {/* Date Box */}
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center w-12 h-14 bg-slate-100 rounded-xl">
                                        <span className="text-xs font-bold text-slate-400 uppercase">
                                            {format(new Date(record.date), 'EEE')}
                                        </span>
                                        <span className="text-xl font-bold text-slate-900">
                                            {format(new Date(record.date), 'dd')}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="font-bold text-slate-900 capitalize flex items-center gap-2">
                                            {record.status === 'absent' ? 'Absent / No Record' : record.status}
                                            {record.status === 'rejected' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                                        </div>

                                        {/* Meta Data */}
                                        {record.status !== 'absent' && (
                                            <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500">
                                                {record.timestamp && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {format(new Date(record.timestamp), 'hh:mm a')}
                                                    </div>
                                                )}
                                                {record.type && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {record.type === 'site' ? record.siteName : 'Office'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Rejection Note */}
                            {record.status === 'rejected' && record.rejectionReason && (
                                <div className="mt-3 pt-3 border-t border-rose-200/50 text-xs text-rose-700 font-medium">
                                    Why: {record.rejectionReason}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
