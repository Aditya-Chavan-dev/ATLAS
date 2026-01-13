import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { LeaveRequest } from '../types/types';

// --- ACTION: Apply (Secure) ---
export const applyForLeave = async (uid: string, request: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'>) => {
    const apply = httpsCallable(functions, 'applyForLeave');
    // Function handles validation, calculation, and write
    const result = await apply({
        from: request.from,
        to: request.to,
        type: request.type,
        reason: request.reason
    });
    return result.data;
};

// --- ACTION: Approve (Secure) ---
export const approveLeave = async (approverUid: string, leave: LeaveRequest) => {
    // Only MD/Owner can call this successfully (checked by Claims)
    const approve = httpsCallable(functions, 'approveLeave');
    await approve({
        uid: leave.uid,
        leaveId: leave.id
    });
};

// --- ACTION: Cancel (Secure) ---
export const cancelLeave = async (uid: string, leave: LeaveRequest, reason: string) => {
    const cancel = httpsCallable(functions, 'cancelLeave');
    await cancel({
        uid: leave.uid,
        leaveId: leave.id,
        reason
    });
};

