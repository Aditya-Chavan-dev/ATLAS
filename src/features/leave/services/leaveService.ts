

export interface LeaveRequest {
    type: 'PL' | 'CO';
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
    reason: string;
}

export interface LeaveRecord {
    id: string;
    uid: string;
    type: 'PL' | 'CO';
    from: string;
    to: string;
    reason: string;
    totalDays: number;
    status: 'pending' | 'approved' | 'rejected' | 'auto-blocked' | 'cancelled';
    appliedAt: number;
    rejectionReason?: string;
}

// Start: Fix Types
interface ExtendedLeaveRecord extends LeaveRecord {
    userName?: string;
    userEmail?: string;
}

// Hardcoded for UI estimation only
// Hardcoded for UI estimation only

// Hardcoded for UI estimation only (Using "YYYY-MM-DD" IST strings)
const HOLIDAYS = [
    '2026-01-26', // Republic Day
    '2026-05-01', // Maharashtra Day
    '2026-08-15', // Independence Day
    '2026-10-02'  // Gandhi Jayanti
];

export const calculateLeaveDays = (startDate: string, endDate: string): number => {
    // Note: We should ideally use a more robust business day calculator
    // but matching the legacy strictness here using dateUtils would require
    // a day-by-day iterator which dateUtils.getDaysDifference partially does.
    // For now, we will trust the simple diff or build a better loop.
    // Let's stick to the simple loop but ensure we don't double-convert timezones.

    // Simple Loop (Safe for "YYYY-MM-DD" inputs)
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const day = current.getDay(); // 0 = Sunday

        if (day !== 0 && !HOLIDAYS.includes(dateStr)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

// --- SECURE CLOUD FUNCTIONS ---

// --- CLIENT SIDE LOGIC (Serverless-Free Revert) ---

import { ref, push, set, update, get, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase/config';

export const applyForLeave = async (uid: string, _userProfile: unknown, request: LeaveRequest) => {
    const totalDays = calculateLeaveDays(request.from, request.to);

    // Note: We cannot securely check balance here (client-trusted). 
    // We rely on "Honor System" + MD Approval Verification.

    const leavesRef = ref(database, `leaves/${uid}`);
    const newLeaveRef = push(leavesRef);

    await set(newLeaveRef, {
        id: newLeaveRef.key,
        uid,
        type: request.type,
        from: request.from,
        to: request.to,
        reason: request.reason,
        totalDays,
        status: 'pending',
        appliedAt: serverTimestamp()
    });

    return { success: true, id: newLeaveRef.key };
};

export const cancelLeave = async (uid: string, leaveId: string, reason: string) => {
    const leaveRef = ref(database, `leaves/${uid}/${leaveId}`);
    await update(leaveRef, {
        status: 'cancelled',
        actedAt: serverTimestamp(),
        rejectionReason: reason // Storing cancellation reason here
    });
};

export const approveLeave = async (approverUid: string, leave: ExtendedLeaveRecord | LeaveRecord) => {
    // 1. Fetch Current Balance
    const balanceRef = ref(database, `employees/${leave.uid}/leaveBalance`);
    const balanceSnap = await get(balanceRef);
    const currentBalance = balanceSnap.val() || { pl: 0, co: 0 };

    // 2. Calculate New Balance
    const leaveType = leave.type.toLowerCase() as 'pl' | 'co';
    const newBalance = (currentBalance[leaveType] || 0) - leave.totalDays;

    // 3. Atomic Update (Status + Balance)
    const updates: Record<string, any> = {};
    updates[`leaves/${leave.uid}/${leave.id}/status`] = 'approved';
    updates[`leaves/${leave.uid}/${leave.id}/actedAt`] = serverTimestamp();
    updates[`leaves/${leave.uid}/${leave.id}/actorId`] = approverUid;
    updates[`leaves/${leave.uid}/${leave.id}/rejectionReason`] = null; // Clear any previous rejection

    // Update Balance
    updates[`employees/${leave.uid}/leaveBalance/${leaveType}`] = newBalance;

    await update(ref(database), updates);
};

export const rejectLeave = async (approverUid: string, leave: ExtendedLeaveRecord | LeaveRecord, reason: string) => {
    const updates: Record<string, any> = {};
    updates[`leaves/${leave.uid}/${leave.id}/status`] = 'rejected';
    updates[`leaves/${leave.uid}/${leave.id}/rejectionReason`] = reason;
    updates[`leaves/${leave.uid}/${leave.id}/actedAt`] = serverTimestamp();
    updates[`leaves/${leave.uid}/${leave.id}/actorId`] = approverUid;

    await update(ref(database), updates);
};

