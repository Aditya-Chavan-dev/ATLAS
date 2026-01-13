import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { AttendanceStatus, LocationType } from '@/types/attendance';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';

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
            const mark = httpsCallable(functions, 'markAttendance');
            await mark({ type, siteName });

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
