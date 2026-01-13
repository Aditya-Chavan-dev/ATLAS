import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { AttendanceRecord, AttendanceStatus } from '@/types/attendance';

import { dateUtils } from '@/utils/dateUtils';

export function useManageAttendance() {
    const [requests, setRequests] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const today = dateUtils.getISTDate();
        const attendanceRef = ref(database, `attendance/${today}`);

        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.values(data) as AttendanceRecord[];
                setRequests(list.sort((a, b) => b.timestamp - a.timestamp));
            } else {
                setRequests([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateStatus = async (uid: string, status: typeof AttendanceStatus['APPROVED'] | typeof AttendanceStatus['REJECTED'], reason?: string) => {
        const today = dateUtils.getISTDate();

        // Calling Render Backend (replacing Cloud Function)
        // Endpoint: /api/attendance/status
        const { apiClient } = await import('@/lib/api');

        try {
            await apiClient('/attendance/status', 'POST', {
                employeeUid: uid,
                date: today,
                status,
                reason
            });
        } catch (err) {
            console.error("Update failed", err);
            throw new Error("Failed to update status. " + (err as any).message);
        }
    };

    return { requests, loading, updateStatus };
}
