import { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth';

export interface HistoryRecord {
    date: string; // YYYY-MM-DD
    status: 'pending' | 'approved' | 'rejected' | 'absent' | 'loading';
    type?: 'office' | 'site';
    siteName?: string;
    timestamp?: number;
    rejectionReason?: string;
}

export function useAttendanceHistory(targetDate: Date) {
    const { user } = useAuth();
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            setLoading(true);
            const promises = [];
            const dates: string[] = [];

            // 1. Get number of days in the target month
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth(); // 0-indexed
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // 2. Generate path for every day in the month
            for (let day = 1; day <= daysInMonth; day++) {
                // Create date string manually to avoid timezone shifts
                // Format: YYYY-MM-DD
                const dayStr = day.toString().padStart(2, '0');
                const monthStr = (month + 1).toString().padStart(2, '0');
                const dateStr = `${year}-${monthStr}-${dayStr}`;

                dates.push(dateStr);
                const path = `attendance/${dateStr}/${user.uid}`;
                promises.push(get(ref(database, path)));
            }

            try {
                // 3. Parallel Fetch
                const snapshots = await Promise.all(promises);

                // 4. Map to records (Reverse order: Newest first)
                const records: HistoryRecord[] = snapshots.map((snap, index) => {
                    const date = dates[index];
                    if (snap.exists()) {
                        const data = snap.val();
                        return {
                            date,
                            status: data.status,
                            type: data.type,
                            siteName: data.siteName,
                            timestamp: data.timestamp,
                            rejectionReason: data.rejectionReason
                        } as HistoryRecord;
                    } else {
                        return {
                            date,
                            status: 'absent'
                        } as HistoryRecord;
                    }
                }).reverse(); // Show latest date at top

                setHistory(records);
            } catch (err) {
                console.error("Failed to fetch history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user, targetDate.getFullYear(), targetDate.getMonth()]); // Re-run when month changes

    return { history, loading };
}
