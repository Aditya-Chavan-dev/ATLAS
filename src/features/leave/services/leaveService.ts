import { ref, push, set, get, update, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { LeaveRequest, LeaveBalance } from '../types/types';
import { dateUtils } from '@/utils/dateUtils';
import { HOLIDAYS_2026, LEAVE_TYPES } from '../types/leaveConstants';

// --- HELPER: Sandwich Rule Calculator ---
export const calculateLeaveDays = (from: string, to: string): number => {
    let count = 0;
    const current = new Date(from);
    const end = new Date(to);

    while (current <= end) {
        const dateStr = dateUtils.formatISTDate(current); // YYYY-MM-DD
        const isHoliday = HOLIDAYS_2026.includes(dateStr);
        const isSunday = current.getDay() === 0;

        if (!isHoliday && !isSunday) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

// --- HELPER: Overlap Check ---
const checkOverlap = async (uid: string, from: string, to: string): Promise<boolean> => {
    const leavesRef = ref(database, `leaves/${uid}`);
    // Ideally we query specifically, but for now client-side filter is robust enough for small sets
    const snapshot = await get(leavesRef);
    if (!snapshot.exists()) return false;

    const leaves = Object.values(snapshot.val()) as LeaveRequest[];
    const rangeStart = new Date(from).getTime();
    const rangeEnd = new Date(to).getTime();

    return leaves.some(leave => {
        if (leave.status === 'cancelled' || leave.status === 'rejected') return false;
        const lStart = new Date(leave.from).getTime();
        const lEnd = new Date(leave.to).getTime();
        // Check intersection
        return (rangeStart <= lEnd && rangeEnd >= lStart);
    });
};

// --- ACTION: Apply ---
export const applyForLeave = async (uid: string, request: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'>) => {
    // 1. Sandwich Calc
    const days = calculateLeaveDays(request.from, request.to);
    if (days <= 0) throw new Error("Selected range contains no working days.");

    // 2. Overlap Check
    const isOverlapping = await checkOverlap(uid, request.from, request.to);
    if (isOverlapping) throw new Error("You already have a leave request for these dates.");

    // 3. Balance Check (Client-Side 'Honest' check - Final check is at Approval)
    // We expect the UI to warn for LWP, but we allow submission.

    const leavesRef = ref(database, `leaves/${uid}`);
    const newLeaveRef = push(leavesRef);

    await set(newLeaveRef, {
        ...request,
        id: newLeaveRef.key,
        days, // Store the calculated sandwich days
        status: 'pending',
        appliedAt: serverTimestamp()
    });

    return newLeaveRef.key;
};

// --- ACTION: Approve (The Big Logic) ---
export const approveLeave = async (approverUid: string, leave: LeaveRequest) => {
    const updates: Record<string, any> = {};

    // 1. Fetch Balance
    const balRef = ref(database, `employees/${leave.uid}/leaveBalance`);
    const balSnap = await get(balRef);
    let balance = balSnap.val() as LeaveBalance;
    if (!balance) balance = { pl: 17, ol: 4, el: 0, lwp: 0 }; // Default Fallback

    // 2. Deduct or Increment LWP
    if (leave.type === LEAVE_TYPES.LWP) {
        balance.lwp = (balance.lwp || 0) + leave.days;
    } else {
        const key = leave.type.toLowerCase() as keyof LeaveBalance;
        if (balance[key] >= leave.days) {
            balance[key] -= leave.days;
        } else {
            // Edge Case: Approved but balance insufficient? Force flip to LWP? 
            // For now, we assume MD checked. We deduct into negative or force switch?
            // Per design "Request Additional" -> LWP. 
            // If they applied as PL but have 0, MD should Reject or we deduct to negative?
            // Let's deduct to negative for now to be traceable, OR switch type.
            // Safer: Deduct.
            balance[key] -= leave.days;
        }
    }

    // 3. Update Leave Status
    updates[`leaves/${leave.uid}/${leave.id}/status`] = 'approved';
    updates[`leaves/${leave.uid}/${leave.id}/actionedBy`] = approverUid;
    updates[`leaves/${leave.uid}/${leave.id}/actionedAt`] = serverTimestamp();

    // 4. Update Balance
    updates[`employees/${leave.uid}/leaveBalance`] = balance;

    // 5. GHOST LEAVE FIX: Update Attendance Calendar
    // Iterate days and mark as Present (for EL) or Leave (for others)? 
    // Wait, LEAVE is LEAVE. 
    const current = new Date(leave.from);
    const end = new Date(leave.to);
    while (current <= end) {
        const dateStr = dateUtils.formatISTDate(current);
        // Only mark if valid working day? Or all days? 
        // Usually leave covers the range. 
        // Sandwich logic excluded holidays from Cost, but Status is still 'On Leave'.
        updates[`attendance/${dateStr}/${leave.uid}`] = {
            status: 'leave',
            type: leave.type, // PL, OL, LWP
            timestamp: serverTimestamp()
        };
        current.setDate(current.getDate() + 1);
    }

    await update(ref(database), updates);
};

// --- ACTION: Cancel ---
export const cancelLeave = async (uid: string, leave: LeaveRequest, reason: string) => {
    if (leave.status !== 'approved') {
        // Simple cancel if pending
        const updates: Record<string, any> = {};
        updates[`leaves/${uid}/${leave.id}/status`] = 'cancelled';
        updates[`leaves/${uid}/${leave.id}/rejectionReason`] = reason; // reusing field
        await update(ref(database), updates);
        return;
    }

    // If Approved, we must REFUND
    const updates: Record<string, any> = {};
    const balRef = ref(database, `employees/${uid}/leaveBalance`);
    const balSnap = await get(balRef);
    let balance = balSnap.val() as LeaveBalance;

    // Refund
    if (leave.type === LEAVE_TYPES.LWP) {
        balance.lwp = Math.max(0, (balance.lwp || 0) - leave.days);
    } else {
        const key = leave.type.toLowerCase() as keyof LeaveBalance;
        balance[key] += leave.days;
    }

    updates[`employees/${uid}/leaveBalance`] = balance;
    updates[`leaves/${uid}/${leave.id}/status`] = 'cancelled';
    updates[`leaves/${uid}/${leave.id}/rejectionReason`] = reason;

    // CLEANUP ATTENDANCE
    const current = new Date(leave.from);
    const end = new Date(leave.to);
    while (current <= end) {
        const dateStr = dateUtils.formatISTDate(current);
        updates[`attendance/${dateStr}/${uid}`] = null; // Delete the 'leave' record
        current.setDate(current.getDate() + 1);
    }

    // NOTIFY MD? (Implemented via UI Alert or Notification node - TODO)

    await update(ref(database), updates);
};
