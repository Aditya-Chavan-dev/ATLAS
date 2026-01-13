import { apiClient } from '@/lib/api';
import { LeaveRequest } from '../types/types';

// --- ACTION: Apply (Secure) ---
export const applyForLeave = async (uid: string, request: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'>) => {
    // Endpoint: /api/leave/apply
    return await apiClient('/leave/apply', 'POST', {
        employeeName: request.employeeName || 'Unknown', // Backend needs this
        from: request.from,
        to: request.to,
        type: request.type,
        reason: request.reason
    });
};

// --- ACTION: Approve (Secure) ---
export const approveLeave = async (approverUid: string, leave: LeaveRequest) => {
    // Endpoint: /api/leave/approve
    await apiClient('/leave/approve', 'POST', {
        leaveId: leave.id,
        employeeId: leave.uid,
        mdId: approverUid,
        mdName: 'MD' // Ideally fetch this, but backend handles it
    });
};

// --- ACTION: Cancel (Secure) ---
export const cancelLeave = async (uid: string, leave: LeaveRequest, reason: string) => {
    // Endpoint: /api/leave/cancel
    await apiClient('/leave/cancel', 'POST', {
        leaveId: leave.id,
        reason
    });
};
