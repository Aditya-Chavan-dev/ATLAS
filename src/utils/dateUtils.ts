export const dateUtils = {
    // Get current date in IST (YYYY-MM-DD)
    getISTDate: (): string => {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(now.getTime() + istOffset);
        return istDate.toISOString().split('T')[0];
    },

    // Get current timestamp (Standard Unix Epoch - Use this for logic/sorting)
    getTimestamp: (): number => {
        return Date.now();
    },

    // Format timestamp to IST Time String (e.g., "10:30 AM")
    formatISTTime: (timestamp: number | Date): string => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    },

    // Format timestamp to IST Date String (e.g., "Monday, January 1")
    formatISTDate: (timestamp: number | Date): string => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            timeZone: 'Asia/Kolkata',
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    },

    // Calculate Days Between Dates
    getDaysDifference: (start: string, end: string): number => {
        const s = new Date(start);
        const e = new Date(end);
        // Normalize to UTC noon to avoid DST/Timezone issues with simple math
        s.setUTCHours(12, 0, 0, 0);
        e.setUTCHours(12, 0, 0, 0);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
    }
};
