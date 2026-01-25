import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { LeaveBalance } from '../types/types';

export function useLeaveBalance(uid?: string) {
    const [balance, setBalance] = useState<LeaveBalance>({ cl: 0, sl: 0, el: 0, lwp: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }

        const balRef = ref(database, `employees/${uid}/leaveBalance`);
        const unsub = onValue(balRef, (snap) => {
            if (snap.exists()) {
                setBalance(snap.val());
            } else {
                // Default balance if not found
                setBalance({ cl: 0, sl: 0, el: 0, lwp: 0 });
            }
            setLoading(false);
        });

        return () => unsub();
    }, [uid]);

    return { balance, loading };
}
