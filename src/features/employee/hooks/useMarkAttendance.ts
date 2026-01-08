import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { AttendanceStatus, LocationType } from '@/types/attendance';
import { dateUtils } from '@/utils/dateUtils';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase/config';

export function useMarkAttendance() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const submitRequest = async ({ type, siteName }: { type: LocationType; siteName?: string }) => {
        if (!user) return;
        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const today = dateUtils.getISTDate();
            const attendanceRef = ref(database, `attendance/${today}/${user.uid}`);

            // 1. Check if already marked (Client-side validation)
            const snapshot = await get(attendanceRef);
            if (snapshot.exists()) {
                const existing = snapshot.val();
                if (existing.status !== AttendanceStatus.REJECTED) {
                    throw new Error('Attendance already marked for today');
                }
            }

            // 2. Write to DB
            await set(attendanceRef, {
                uid: user.uid,
                name: user.displayName || 'Unknown',
                photoURL: user.photoURL || '',
                type,
                siteName: type === 'site' ? siteName : null,
                status: AttendanceStatus.PENDING,
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent
            });

            setStatus('success');
            setMessage('Attendance marked successfully');
        } catch (err: any) {
            console.error('Attendance Error:', err);
            setStatus('error');
            setMessage(err.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return { submitRequest, loading, status, message };
}
