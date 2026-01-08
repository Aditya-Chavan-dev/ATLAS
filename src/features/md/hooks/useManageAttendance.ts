import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { AttendanceRecord, AttendanceStatus } from '@/types/attendance';

import { dateUtils } from '@/utils/dateUtils';
import { HOLIDAYS_2026 } from '@/features/leave/types/leaveConstants';

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
        const updates: Record<string, any> = {};

        const basePath = `attendance/${today}/${uid}`;
        updates[`${basePath}/status`] = status;

        if (reason) updates[`${basePath}/rejectionReason`] = reason;
        if (status === AttendanceStatus.APPROVED) {
            updates[`${basePath}/approvedAt`] = Date.now();

            // EL ACCRUAL LOGIC (Sunday/Holiday Rule)
            const dateObj = new Date(today);
            const day = dateObj.getDay(); // 0 = Sunday
            const isHoliday = HOLIDAYS_2026.includes(today);

            if (day === 0 || isHoliday) {
                // Fetch current balance to increment EL (Atomic increment would be better but simple GET-SET for now)
                // Since this is client-side, we queue the update blindly using firebase transaction support logic ideally.
                // But simplified: we just use the raw path increment if we could, but RTDB simpler to just set.
                // Actually, let's use the transaction-like pattern: read first.
                // But complexity! Let's assume for now we just increment blindly? No, that sends 1. 
                // We need to fetch. 

                // Wait, useManageAttendance is a Hook. Async logic inside map?
                // We better move this "Approve" logic to a proper SERVICE function to keep the Hook clean.
                // But for now, let's inline access to `get`.
                // We need to dynamically import `get` and `ref` inside if needed or just use `transaction`?
                // Transaction is best for counters.

                // Let's use `runTransaction` for the balance update to be safe.
            }
        }

        try {
            await update(ref(database), updates);

            // POST-UPDATE: Handle EL Transaction if needed
            if (status === AttendanceStatus.APPROVED) {
                const dateObj = new Date(today);
                if (dateObj.getDay() === 0 || HOLIDAYS_2026.includes(today)) {
                    const { runTransaction } = await import('firebase/database');
                    const elRef = ref(database, `employees/${uid}/leaveBalance/el`);
                    await runTransaction(elRef, (currentEl) => {
                        return (currentEl || 0) + 1;
                    });
                }
            }

        } catch (err) {
            console.error("Update failed", err);
            throw new Error("Failed to update status");
        }
    };

    return { requests, loading, updateStatus };
}
