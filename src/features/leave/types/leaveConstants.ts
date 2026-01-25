export const LEAVE_TYPES = {
    CL: 'CL', // Casual Leave
    SL: 'SL', // Sick Leave
    EL: 'EL', // Earned Leave
    LWP: 'LWP' // Leave Without Pay
} as const;

export type LeaveType = keyof typeof LEAVE_TYPES;



export const LEAVE_QUOTAS = {
    [LEAVE_TYPES.CL]: 6,  // Example quota
    [LEAVE_TYPES.SL]: 6,  // Example quota
    [LEAVE_TYPES.EL]: 0,
    [LEAVE_TYPES.LWP]: 0
};
