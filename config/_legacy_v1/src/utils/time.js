import { format as fnsFormat, parseISO, differenceInSeconds } from 'date-fns';

/**
 * Canonical Time Utility
 * 
 * THIS IS THE ONLY PLACE WHERE NEW DATE() IS ALLOWED.
 * All other files must use this utility.
 */

export const time = {
    /**
     * Get current timestamp as ISO 8601 string
     * @returns {string} e.g. "2023-10-27T10:00:00.000Z"
     */
    now: () => new Date().toISOString(),

    /**
     * Get current date string (YYYY-MM-DD)
     * @returns {string} e.g. "2023-10-27"
     */
    today: () => new Date().toISOString().split('T')[0],

    /**
     * Get current month string (YYYY-MM)
     * @returns {string} e.g. "2023-10"
     */
    currentMonth: () => new Date().toISOString().slice(0, 7),

    /**
     * Format a date string or timestamp
     * @param {string|Date} date 
     * @param {string} pattern - date-fns pattern
     * @returns {string}
     */
    format: (date, pattern = 'PPP') => {
        try {
            const dateObj = typeof date === 'string' ? parseISO(date) : date;
            return fnsFormat(new Date(dateObj), pattern);
        } catch (e) {
            console.error('[Time] Invalid date:', date);
            return 'Invalid Date';
        }
    },

    /**
     * Get Date object (use sparingly, prefer ISO strings)
     * @param {string} dateStr 
     */
    toDate: (dateStr) => new Date(dateStr)
}
