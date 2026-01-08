import { useState, useMemo, useEffect } from 'react';
import { useAttendanceHistory, HistoryRecord } from '../hooks/useAttendanceHistory';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock, Info, CheckCircle, XCircle, AlertCircle, Ban } from 'lucide-react';

export default function EmployeeHistory() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateRecord, setSelectedDateRecord] = useState<HistoryRecord | null>(null);
    const { history, loading } = useAttendanceHistory(currentDate);

    // Navigation Handlers
    const prevMonth = () => {
        const d = new Date(currentDate);
        d.setMonth(d.getMonth() - 1);
        setCurrentDate(d);
        setSelectedDateRecord(null); // Clear selection on month change
    };

    const nextMonth = () => {
        const d = new Date(currentDate);
        const today = new Date();
        if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) return;
        d.setMonth(d.getMonth() + 1);
        setCurrentDate(d);
        setSelectedDateRecord(null);
    };

    const isCurrentMonth = () => {
        const today = new Date();
        return currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    };

    // Calendar Logic
    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Create a Map for fast lookup: "2024-01-05" -> Record
        const historyMap = new Map<string, HistoryRecord>();
        history.forEach(rec => historyMap.set(rec.date, rec));

        const days = [];
        // Empty slots for start of month
        for (let i = 0; i < firstDay; i++) {
            days.push({ id: `empty-${i}`, day: null });
        }
        // Actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const record = historyMap.get(dateStr) || { date: dateStr, status: 'absent' as const };
            days.push({ id: dateStr, day: d, record });
        }

        return days;
    }, [currentDate, history]);

    // Auto-select today if in current month and no selection
    useEffect(() => {
        if (!selectedDateRecord && isCurrentMonth() && history.length > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayRecord = history.find(h => h.date === todayStr);
            if (todayRecord) setSelectedDateRecord(todayRecord);
        }
    }, [history]);

    const getStatusColor = (status: string, isSelected: boolean) => {
        if (isSelected) return 'ring-2 ring-offset-2 ring-slate-900 z-10';
        switch (status) {
            case 'approved': return 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200';
            case 'rejected': return 'bg-red-100/80 text-red-800 hover:bg-red-200';
            case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100';
            case 'absent': return 'hover:bg-slate-50 text-slate-400';
            default: return 'bg-slate-50';
        }
    };

    const StatusIcon = ({ status }: { status: string }) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
            case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
            case 'pending': return <Clock className="w-5 h-5 text-amber-600" />;
            default: return <Ban className="w-5 h-5 text-slate-300" />;
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-slate-400" />
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <button
                    onClick={nextMonth}
                    disabled={isCurrentMonth()}
                    className={`p-2 rounded-xl transition-colors ${isCurrentMonth() ? 'text-slate-200' : 'hover:bg-slate-50 text-slate-400'}`}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days */}
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-300">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                        {calendarData.map((item) => {
                            if (!item.day) return <div key={item.id} />;

                            const isSelected = selectedDateRecord?.date === item.record.date;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedDateRecord(item.record)}
                                    className={`
                                        aspect-square rounded-xl flex items-center justify-center text-sm font-semibold transition-all relative
                                        ${getStatusColor(item.record.status, isSelected)}
                                    `}
                                >
                                    {item.day}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Panel */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 min-h-[160px] animate-in slide-in-from-bottom-4 duration-500">
                {selectedDateRecord ? (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">
                                    {new Date(selectedDateRecord.date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'short'
                                    })}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <StatusIcon status={selectedDateRecord.status} />
                                    <span className={`font-medium capitalize ${selectedDateRecord.status === 'approved' ? 'text-emerald-700' :
                                            selectedDateRecord.status === 'rejected' ? 'text-red-700' :
                                                selectedDateRecord.status === 'pending' ? 'text-amber-700' : 'text-slate-500'
                                        }`}>
                                        {selectedDateRecord.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {selectedDateRecord.status !== 'absent' && (
                            <div className="space-y-3 pt-2">
                                {/* Time & Location */}
                                <div className="flex items-center gap-6">
                                    {selectedDateRecord.timestamp && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span className="font-mono text-sm">
                                                {new Date(selectedDateRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                    {selectedDateRecord.type && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-medium">
                                                {selectedDateRecord.type === 'office' ? 'Office HQ' : selectedDateRecord.siteName}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Rejection Reason */}
                                {selectedDateRecord.status === 'rejected' && selectedDateRecord.rejectionReason && (
                                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex gap-3 items-start">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <div className="text-xs font-bold text-red-800 uppercase tracking-wide">Manager's Note</div>
                                            <div className="text-sm text-red-700">{selectedDateRecord.rejectionReason}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedDateRecord.status === 'absent' && (
                            <p className="text-slate-400 text-sm italic">No attendance record found for this day.</p>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-4">
                        <Info className="w-8 h-8 text-slate-300" />
                        <p className="text-slate-400 font-medium">Select a date to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
}
