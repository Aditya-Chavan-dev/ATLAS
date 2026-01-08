import { LEAVE_TYPES } from './leaveConstants';

export interface LeaveBalance {
    pl: number;
    ol: number;
    el: number;
    lwp: number; // Counter for unpaid leaves taken
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
