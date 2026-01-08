
export const LEAVE_TYPES = {
    PL: 'PL' as const, // Provisional Leave (17)
    OL: 'OL' as const, // Occasional Leave (4)
    EL: 'EL' as const, // Earned Leave (Dynamic)
    LWP: 'LWP' as const // Loss of Pay (Excess)
};

export type LeaveType = typeof LEAVE_TYPES[keyof typeof LEAVE_TYPES];

// TODO: Move this to a DB-backed configuration eventually
export const HOLIDAYS_2026 = [
    '2026-01-26', // Republic Day
    '2026-03-07', // Holi (Example)
    '2026-05-01', // Maharashtra Day
    '2026-08-15', // Independence Day
    '2026-10-02', // Gandhi Jayanti
    '2026-12-25'  // Christmas
];

export const LEAVE_QUOTAS = {
    [LEAVE_TYPES.PL]: 17,
    [LEAVE_TYPES.OL]: 4,
    [LEAVE_TYPES.EL]: 0, // Starts at 0
    [LEAVE_TYPES.LWP]: 0
};
