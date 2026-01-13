import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { LocationType } from '@/types/attendance';
import { apiClient } from '@/lib/api';

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

        // Get Client-Side Date for reference (Backend uses Server Time anyway)
        const dateStr = new Date().toISOString().split('T')[0];

        try {
            await apiClient('/attendance/mark', 'POST', {
                locationType: type,
                siteName,
                dateStr
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
