import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth';
import type { EmployeeStats } from '../types/attendance.types';

export function useEmployeeStats() {
    const { user } = useAuth();
    const [stats, setStats] = useState<EmployeeStats>({
        daysAttended: 0,
        elBalance: 12,
        plBalance: 7,
    });
    const [loading, setLoading] = useState(true);
    const [todayStatus, setTodayStatus] = useState<{
        status: 'pending' | 'approved' | 'rejected' | null;
        type?: 'office' | 'site';
        siteName?: string;
        rejectionReason?: string;
        timestamp?: number;
    }>({ status: null });

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Listen to today's attendance status
        // New Schema: attendance/{YYYY-MM-DD}/{uid}
        const today = new Date().toISOString().split('T')[0];
        const todayRef = ref(database, `attendance/${today}/${user.uid}`);

        const unsubscribeToday = onValue(todayRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setTodayStatus({
                    status: data.status,
                    type: data.type,
                    siteName: data.siteName,
                    rejectionReason: data.rejectionReason,
                    timestamp: data.timestamp
                });
            } else {
                setTodayStatus({ status: null });
            }
        });

        // Fetch overall stats (Note: querying total attendance is harder with date-first schema,
        // we might need a separate index later. for now, we keep the old stats logic 
        // OR we just count based on a user-index if it existed. 
        // Since we changed the write path, the old `attendance/${uid}` won't get new writes.
        // We will defer fixing historical stats until the MD portal aggregating task.
        // For now, let's just return 0 or mock stats to avoid breakage.)
        setStats({
            daysAttended: 0, // Placeholder until aggregation logic is fixed
            elBalance: 12,
            plBalance: 7
        });
        setLoading(false);

        return () => {
            unsubscribeToday();
        };
    }, [user]);

    return { stats, loading, todayStatus };
}
