import { database } from '@/lib/firebase/config';
import { ref, get, push, set, update } from 'firebase/database';

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

// Hardcoded for now, mirroring legacy simplicity
const HOLIDAYS = [
    '2026-01-26', // Republic Day
    '2026-05-01', // Maharashtra Day
    '2026-08-15', // Independence Day
    '2026-10-02'  // Gandhi Jayanti
];

export const calculateLeaveDays = (startDate: string, endDate: string): number => {
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

const checkOverlap = async (uid: string, from: string, to: string) => {
    // 1. Check existing Leaves
    const leavesRef = ref(database, `leaves/${uid}`);
    const snapshot = await get(leavesRef);
    if (snapshot.exists()) {
        const leaves = Object.values(snapshot.val()) as LeaveRecord[];
        const requestedStart = new Date(from);
        const requestedEnd = new Date(to);

        for (const leave of leaves) {
            if (leave.status === 'rejected' || leave.status === 'cancelled') continue;

            const existingStart = new Date(leave.from);
            const existingEnd = new Date(leave.to);

            // Overlap Condition: (StartA <= EndB) and (EndA >= StartB)
            if (requestedStart <= existingEnd && requestedEnd >= existingStart) {
                return { conflict: true, type: 'LEAVE', record: leave };
            }
        }
    }

    // 2. Check Attendance (Iterate through dates)
    const current = new Date(from);
    const end = new Date(to);
    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const attRef = ref(database, `attendance/${dateStr}/${uid}`);
        const attSnap = await get(attRef);

        if (attSnap.exists()) {
            return { conflict: true, type: 'ATTENDANCE', date: dateStr };
        }
        current.setDate(current.getDate() + 1);
    }

    return null;
};

export const applyForLeave = async (uid: string, _userProfile: any, request: LeaveRequest) => {
    // 1. Logic Validation
    const totalDays = calculateLeaveDays(request.from, request.to);
    if (totalDays === 0) throw new Error("Selected dates contain no billable days (All holidays/Sundays).");
    if (totalDays > 30) throw new Error("Cannot apply for more than 30 days.");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(request.from) < today) throw new Error("Cannot apply for past dates.");

    // 2. Balance Check (Read-Only)
    const balanceRef = ref(database, `employees/${uid}/leaveBalance`);
    const balanceSnap = await get(balanceRef);
    const balance = balanceSnap.val() || { pl: 17, co: 0 }; // Default as per legacy

    if (request.type === 'PL' && balance.pl < totalDays) {
        throw new Error(`Insufficient PL Balance. Available: ${balance.pl}, Required: ${totalDays}`);
    }
    if (request.type === 'CO' && balance.co < totalDays) {
        throw new Error(`Insufficient CO Balance. Available: ${balance.co}, Required: ${totalDays}`);
    }

    // 3. Conflict Check
    const conflict = await checkOverlap(uid, request.from, request.to);

    // 4. Construct Payload
    const newLeaveRef = push(ref(database, `leaves/${uid}`));
    const leaveId = newLeaveRef.key!;

    const payload: LeaveRecord = {
        id: leaveId,
        uid,
        type: request.type,
        from: request.from,
        to: request.to,
        reason: request.reason,
        totalDays, // The billable days
        status: conflict ? 'auto-blocked' : 'pending', // Auto-block if conflict found (Legacy Behavior)
        appliedAt: Date.now(),
        ...(conflict ? { rejectionReason: `System Conflict: ${conflict.type === 'LEAVE' ? 'Existing Leave' : 'Attendance Marked'}` } : {})
    };

    // 5. Commit
    await set(newLeaveRef, payload);

    // Notify if auto-blocked (In a real backend we'd push notification here, client side we just return status)
    return payload;
};

// --- NEW FEATURES (LEGACY PORT) ---

export const cancelLeave = async (uid: string, leaveId: string, reason: string) => {
    const leaveRef = ref(database, `leaves/${uid}/${leaveId}`);
    const snapshot = await get(leaveRef);
    if (!snapshot.exists()) throw new Error("Leave request not found");

    const leave = snapshot.val() as LeaveRecord;
    if (leave.status !== 'pending') throw new Error("Only pending leaves can be cancelled");

    await set(leaveRef, {
        ...leave,
        status: 'cancelled',
        actedAt: Date.now(),
        actorId: uid,
        rejectionReason: reason // Storing cancel reason here for simplicity
    });
};

export const approveLeave = async (approverUid: string, leave: ExtendedLeaveRecord | LeaveRecord) => {
    // 1. ZOMBIE CHECK (Verify Approver is MD/Owner)
    const roleRef = ref(database, `employees/${approverUid}/profile/role`);
    const roleSnap = await get(roleRef);
    const role = (roleSnap.val() || '').toLowerCase();

    if (!['md', 'admin', 'owner'].includes(role)) {
        throw new Error("Access Denied: Unauthorzied Approver");
    }

    // 2. DEDUCTION & UPDATE (Atomic-ish via set/update, but strictly we should use transaction for balance)
    // For V3.2 Client-Side, we will do sequential checks + update 
    // because RTDB multi-path transactions are hard on client.

    const balanceRef = ref(database, `employees/${leave.uid}/leaveBalance`);
    const leaveRef = ref(database, `leaves/${leave.uid}/${leave.id}`);

    // Re-check status
    const currentLeaveSnap = await get(leaveRef);
    if (currentLeaveSnap.val().status !== 'pending') throw new Error("Request is no longer pending");

    // Re-check Balance
    const balanceSnap = await get(balanceRef);
    const balance = balanceSnap.val() || { pl: 17, co: 0 };

    const newBalance = { ...balance };
    if (leave.type === 'PL') {
        if (newBalance.pl < leave.totalDays) throw new Error("Insufficient PL Balance");
        newBalance.pl -= leave.totalDays;
    } else {
        if (newBalance.co < leave.totalDays) throw new Error("Insufficient CO Balance");
        newBalance.co -= leave.totalDays;
    }

    // UPDATE EVERYTHING
    const updates: any = {};
    updates[`employees/${leave.uid}/leaveBalance`] = newBalance;
    updates[`leaves/${leave.uid}/${leave.id}/status`] = 'approved';
    updates[`leaves/${leave.uid}/${leave.id}/actedAt`] = Date.now();
    updates[`leaves/${leave.uid}/${leave.id}/actorId`] = approverUid;

    // 3. ATTENDANCE OVERRIDE (Retroactive)
    const start = new Date(leave.from);
    const end = new Date(leave.to);
    const current = new Date(start);
    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const attPath = `attendance/${dateStr}/${leave.uid}`;

        // Optimistic check: We could just overwrite, but let's be safe per legacy "Override" semantics
        try {
            const attSnap = await get(ref(database, attPath));
            if (attSnap.exists()) {
                updates[`${attPath}/status`] = 'leave_override';
                updates[`${attPath}/mdReason`] = 'Overridden by approved leave';
                updates[`${attPath}/overrideBy`] = approverUid;
            }
        } catch (e) {
            console.warn("Failed to check attendance for override:", dateStr);
        }

        current.setDate(current.getDate() + 1);
    }

    await update(ref(database), updates);
};

export const rejectLeave = async (approverUid: string, leave: ExtendedLeaveRecord | LeaveRecord, reason: string) => {
    // ZOMBIE CHECK
    const roleRef = ref(database, `employees/${approverUid}/profile/role`);
    const roleSnap = await get(roleRef);
    const role = (roleSnap.val() || '').toLowerCase();

    if (!['md', 'admin', 'owner'].includes(role)) {
        throw new Error("Access Denied");
    }

    const leaveRef = ref(database, `leaves/${leave.uid}/${leave.id}`);
    const snapshot = await get(leaveRef);
    const currentLeave = snapshot.val();

    await set(leaveRef, {
        ...currentLeave,
        status: 'rejected',
        actedAt: Date.now(),
        actorId: approverUid,
        rejectionReason: reason
    });
};

// Start: Fix Types
interface ExtendedLeaveRecord extends LeaveRecord {
    userName?: string;
    userEmail?: string;
}
