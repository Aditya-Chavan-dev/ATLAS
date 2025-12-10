/**
 * Formats a date string or object to "20th Dec 2025" format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    if (isNaN(d.getTime())) return '-'

    const day = d.getDate()
    const month = d.toLocaleString('default', { month: 'short' })
    const year = d.getFullYear()

    const suffix = (day) => {
        if (day > 3 && day < 21) return 'th'
        switch (day % 10) {
            case 1: return 'st'
            case 2: return 'nd'
            case 3: return 'rd'
            default: return 'th'
        }
    }

    return `${day}${suffix(day)} ${month} ${year}`
}

/**
 * Formats a date string or object to "9:00 AM" format (12-hour)
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    if (isNaN(d.getTime())) return '-'

    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
}

/**
 * Returns today's date in YYYY-MM-DD format for input min attributes
 * @returns {string} Today's date string
 */
export const getTodayString = () => {
    return new Date().toISOString().split('T')[0]
}
