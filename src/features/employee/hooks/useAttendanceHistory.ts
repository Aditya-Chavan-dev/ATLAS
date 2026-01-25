import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth';

export interface HistoryRecord {
    date: string; // YYYY-MM-DD
    status: 'pending' | 'approved' | 'rejected' | 'absent' | 'loading' | 'Present';
    type?: 'office' | 'site';
    siteName?: string;
    timestamp?: string; // ISO String from backend
    rejectionReason?: string;
}

export function useAttendanceHistory(targetDate: Date) {
    const { user } = useAuth();
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Path: employees/{uid}/attendance
        // This contains all history keyed by "YYYY-MM-DD"
        const attendanceRef = ref(database, `employees/${user.uid}/attendance`);

        setLoading(true);
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();

                // Convert object to array
                const allRecords = Object.entries(data).map(([date, record]: [string, any]) => ({
                    date,
                    status: record.status,
                    type: record.locationType ? record.locationType.toLowerCase() : 'office',
                    siteName: record.siteName,
                    timestamp: record.timestamp, // Ensure backend sends string or we handle number
                    rejectionReason: record.mdReason || record.specialNote
                } as HistoryRecord));

                // Filter by selected month? 
                // The prompt asked for "Monthly Swipe", so validation logic in UI filters it.
                // But efficient data loading says: Load all (if small) or query.
                // For now, load all and filter in memory (Attendance history isn't huge yet).

                const targetMonth = targetDate.getMonth();
                const targetYear = targetDate.getFullYear();

                const filtered = allRecords.filter(rec => {
                    const d = new Date(rec.date);
                    return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
                });

                // Sort: Newest First
                filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setHistory(filtered);
            } else {
                setHistory([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, targetDate.getFullYear(), targetDate.getMonth()]);

    return { history, loading };
}
