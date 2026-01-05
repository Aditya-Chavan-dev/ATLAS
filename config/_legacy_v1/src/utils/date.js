/**
 * ATLAS Date Authority (Locked)
 * Single source of truth for date calculations.
 */

export const getTodayISO = () => {
    return new Date().toISOString().split('T')[0];
};
