import { LEAVE_TYPES } from './leaveConstants';

export interface LeaveBalance {
    cl: number; // Casual Leave
    sl: number; // Sick Leave
    el: number; // Earned Leave (Privilege Leave)
    lwp: number; // Leave Without Pay (Counter)
}

export interface LeaveRequest {
    id?: string;
    uid: string;
    type: keyof typeof LEAVE_TYPES;
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
    days: number; // Pre-calculated working days (sandwich rule applied)
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    appliedAt: number;
    actionedAt?: number;
    actionedBy?: string;
    rejectionReason?: string;
}

export interface ExtendedLeaveRequest extends LeaveRequest {
    userName?: string;
    userEmail?: string;
}
