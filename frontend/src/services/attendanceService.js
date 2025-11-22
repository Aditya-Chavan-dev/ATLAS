import api from './api';

/**
 * Attendance Service
 * Handles all attendance-related API calls for simplified Office/Site system
 */

/**
 * Mark attendance (Office or Site)
 * @param {Object} data - Attendance data
 * @param {string} data.employeeId - Employee ID
 * @param {string} data.employeeName - Employee name
 * @param {string} data.type - 'Office' or 'Site'
 * @param {string} data.siteName - Site name (required if type='Site')
 * @returns {Promise<Object>} Response with attendance ID and status
 */
export const markAttendance = async (data) => {
    try {
        const response = await api.post('/attendance/mark', data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Edit existing attendance
 * @param {string} attendanceId - Attendance record ID
 * @param {Object} data - Updated attendance data
 * @param {string} data.type - 'Office' or 'Site'
 * @param {string} data.siteName - Site name (if type='Site')
 * @returns {Promise<Object>} Response with success message
 */
export const editAttendance = async (attendanceId, data) => {
    try {
        const response = await api.put(`/attendance/edit/${attendanceId}`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Get today's attendance for an employee
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Object|null>} Today's attendance or null if not marked
 */
export const getTodayAttendance = async (employeeId) => {
    try {
        const response = await api.get(`/attendance/today?employeeId=${employeeId}`);
        return response.data;
    } catch (error) {
        // Return null if no attendance found (404)
        if (error.status === 404) {
            return null;
        }
        throw error;
    }
};

/**
 * Get pending attendance approvals (MD only)
 * @returns {Promise<Array>} Array of pending attendance records
 */
export const getPendingApprovals = async () => {
    try {
        const response = await api.get('/attendance/pending');
        return response.data.data || []; // Extract the 'data' property from the response
    } catch (error) {
        throw error;
    }
};

/**
 * Approve attendance
 * @param {string} attendanceId - Attendance record ID
 * @param {string} approvedBy - MD/Admin ID
 * @returns {Promise<Object>} Response with success message
 */
export const approveAttendance = async (attendanceId, approvedBy) => {
    try {
        const response = await api.put(`/attendance/approve/${attendanceId}`, {
            status: 'Approved',
            approvedBy,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Reject attendance
 * @param {string} attendanceId - Attendance record ID
 * @param {string} rejectedBy - MD/Admin ID
 * @returns {Promise<Object>} Response with success message
 */
export const rejectAttendance = async (attendanceId, rejectedBy) => {
    try {
        const response = await api.put(`/attendance/reject/${attendanceId}`, {
            rejectedBy,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Get employee's attendance history
 * @param {string} employeeId - Employee ID
 * @param {string} startDate - Start date (optional, format: YYYY-MM-DD)
 * @param {string} endDate - End date (optional, format: YYYY-MM-DD)
 * @returns {Promise<Array>} Array of attendance records
 */
export const getMyAttendance = async (employeeId, startDate = null, endDate = null) => {
    try {
        let url = `/attendance/my?employeeId=${employeeId}`;

        if (startDate) {
            url += `&startDate=${startDate}`;
        }
        if (endDate) {
            url += `&endDate=${endDate}`;
        }

        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default {
    markAttendance,
    editAttendance,
    getTodayAttendance,
    getPendingApprovals,
    approveAttendance,
    rejectAttendance,
    getMyAttendance,
};
