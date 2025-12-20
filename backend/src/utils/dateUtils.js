const holidays = require('../config/holidays');

const getTodayDateIST = () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
};

const isSunday = (dateStr) => {
    const date = new Date(dateStr);
    return date.getDay() === 0;
};

const isNationalHoliday = (dateStr) => {
    return holidays.includes(dateStr);
};

const getLeaveDaysCount = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    let count = 0;
    let current = new Date(s);

    while (current <= e) {
        const dateStr = current.toISOString().split('T')[0];
        // Exclude Sundays and Holidays for PL
        // Note: The caller might need specific logic for CO or Sick Leave, but defining the exclusion here helps.
        // Actually, "5.1 ... Count valid leave days ... Exclude Sundays and National Holidays".
        // We will assume this function returns "Billable Leave Days".

        if (!isSunday(dateStr) && !isNationalHoliday(dateStr)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

module.exports = { getTodayDateIST, isSunday, isNationalHoliday, getLeaveDaysCount };
