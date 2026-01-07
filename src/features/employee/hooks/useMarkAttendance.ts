import { useState } from 'react';
import { ref, set, get, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth';

interface AttendanceRequest {
    type: 'office' | 'site';
    siteName?: string;
}

export function useMarkAttendance() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const submitRequest = async ({ type, siteName }: AttendanceRequest) => {
        if (!user) {
            setStatus('error');
            setMessage('Not authenticated');
            return;
        }

        if (type === 'site' && !siteName) {
            setStatus('error');
            setMessage('Site name is required');
            return;
        }

        setLoading(true);
        setStatus('idle');

        try {
            // New Schema: attendance/{YYYY-MM-DD}/{uid}
            const today = new Date().toISOString().split('T')[0];
            const attendanceRef = ref(database, `attendance/${today}/${user.uid}`);

            // Check if already pending or approved
            const snapshot = await get(attendanceRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.status === 'pending') {
                    setStatus('error');
                    setMessage('Request already pending approval.');
                    setLoading(false);
                    return;
                }
                if (data.status === 'approved') {
                    setStatus('error');
                    setMessage('Attendance already approved for today.');
                    setLoading(false);
                    return;
                }
                // If 'rejected', we allow overwrite (Retry)
            }

            // Create Request
            await set(attendanceRef, {
                uid: user.uid,
                name: user.displayName || 'Unknown Employee',
                photoURL: user.photoURL || '',
                type,
                siteName: type === 'site' ? siteName : null,
                status: 'pending',
                timestamp: serverTimestamp(),
                rejectionReason: null // Clear any previous rejection
            });

            setStatus('success');
            setMessage('Request sent to MD successfully');
            setLoading(false);
        } catch (err: any) {
            console.error('Attendance Request Error:', err);
            setStatus('error');
            setMessage(err.message || 'Failed to submit request');
            setLoading(false);
        }
    };

    return { submitRequest, loading, status, message };
}
