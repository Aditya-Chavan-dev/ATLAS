/**
 * Date Utility Functions
 * Helper functions for date formatting and manipulation
 */

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Format date to short string (e.g., "Nov 21, 2025")
 * @param {string|Date} date - Date to format
 * @returns {string} Short formatted date
 */
export const formatDateShort = (date) => {
    return formatDate(date, { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateISO = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
};

/**
 * Format time to readable string
 * @param {string|Date} date - Date/time to format
 * @returns {string} Formatted time string (e.g., "9:30 AM")
 */
export const formatTime = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

/**
 * Format date and time together
 * @param {string|Date} date - Date/time to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

/**
 * Calculate days between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Number of days (inclusive)
 */
export const calculateDaysBetween = (startDate, endDate) => {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1; // +1 to make it inclusive
};

/**
 * Get day of week
 * @param {string|Date} date - Date
 * @returns {string} Day name (e.g., "Monday")
 */
export const getDayOfWeek = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
};

/**
 * Get short day of week
 * @param {string|Date} date - Date
 * @returns {string} Short day name (e.g., "Mon")
 */
export const getDayOfWeekShort = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
};

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();

    return (
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()
    );
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now - dateObj;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

    return formatDateShort(dateObj);
};

/**
 * Get start and end of current month
 * @returns {Object} Object with startDate and endDate
 */
export const getCurrentMonthRange = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
        startDate: formatDateISO(startDate),
        endDate: formatDateISO(endDate),
    };
};

/**
 * Parse date range string to dates
 * @param {string} rangeString - Date range string (e.g., "2025-11-01 to 2025-11-30")
 * @returns {Object} Object with startDate and endDate
 */
export const parseDateRange = (rangeString) => {
    const [start, end] = rangeString.split(' to ');
    return {
        startDate: start.trim(),
        endDate: end.trim(),
    };
};

export default {
    formatDate,
    formatDateShort,
    formatDateISO,
    formatTime,
    formatDateTime,
    calculateDaysBetween,
    getDayOfWeek,
    getDayOfWeekShort,
    isToday,
    getRelativeTime,
    getCurrentMonthRange,
    parseDateRange,
};
