import { apiClient } from '@/lib/api';
import { LeaveRequest } from '../types/types';

// --- ACTION: Apply (Secure) ---
// --- ACTION: Apply (Secure) ---
export const applyForLeave = async (employeeName: string, request: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'>) => {
    // Endpoint: /api/leave/apply
    return await apiClient('/leave/apply', 'POST', {
        employeeName: employeeName || 'Unknown',
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
export const cancelLeave = async (leave: LeaveRequest, reason: string) => {
    // Endpoint: /api/leave/cancel
    await apiClient('/leave/cancel', 'POST', {
        leaveId: leave.id,
        reason
    });
};

// --- ACTION: Reject (Secure) ---
export const rejectLeave = async (mdUid: string, leave: LeaveRequest, reason: string) => {
    // Endpoint: /api/leave/reject
    await apiClient('/leave/reject', 'POST', {
        leaveId: leave.id,
        employeeId: leave.uid,
        mdId: mdUid,
        mdName: 'MD',
        reason
    });
};
