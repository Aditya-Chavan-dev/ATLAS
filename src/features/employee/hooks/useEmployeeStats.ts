import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth';
import type { EmployeeStats } from '../types/attendance.types';

export function useEmployeeStats() {
    const { user } = useAuth();
    const [stats, setStats] = useState<EmployeeStats>({
        daysAttended: 0
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
        // Path: employees/{uid}/attendance/{YYYY-MM-DD}
        // This matches the Backend Write Path
        const today = new Date().toISOString().split('T')[0];
        const todayRef = ref(database, `employees/${user.uid}/attendance/${today}`);

        const unsubscribeToday = onValue(todayRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setTodayStatus({
                    status: data.status,
                    type: data.locationType ? data.locationType.toLowerCase() : 'office',
                    siteName: data.siteName,
                    rejectionReason: data.mdReason,
                    timestamp: data.timestamp
                });
            } else {
                setTodayStatus({ status: null });
            }
        });

        // 2. Fetch Attendance Stats (Count Days Present in Current Month)
        const attendanceRef = ref(database, `employees/${user.uid}/attendance`);

        const unsubscribeStats = onValue(attendanceRef, (snapshot) => {
            let presentCount = 0;
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.entries(data).forEach(([dateStr, record]: [string, any]) => {
                    const recordDate = new Date(dateStr);
                    // Check if record is in current month AND status is valid
                    if (recordDate.getMonth() === currentMonth &&
                        recordDate.getFullYear() === currentYear &&
                        (record.status === 'Present' || record.status === 'approved' || record.status === 'half-day')) {
                        presentCount++;
                    }
                });
            }

            setStats({
                daysAttended: presentCount
            });
            setLoading(false);
        });

        return () => {
            unsubscribeToday();
            unsubscribeStats();
        };
    }, [user]);

    return { stats, loading, todayStatus };
}
