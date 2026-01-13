
export const LEAVE_TYPES = {
    PL: 'PL' as const, // Provisional Leave (17)
    OL: 'OL' as const, // Occasional Leave (4)
    EL: 'EL' as const, // Earned Leave (Dynamic)
    LWP: 'LWP' as const // Loss of Pay (Excess)
};

export type LeaveType = typeof LEAVE_TYPES[keyof typeof LEAVE_TYPES];



export const LEAVE_QUOTAS = {
    [LEAVE_TYPES.PL]: 17,
    [LEAVE_TYPES.OL]: 4,
    [LEAVE_TYPES.EL]: 0, // Starts at 0
    [LEAVE_TYPES.LWP]: 0
};
