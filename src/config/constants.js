/**
 * ATLAS SYSTEM CONSTANTS
 * SINGLE SOURCE OF TRUTH FOR BUSINESS RULES
 * 
 * All business logic constraints defined here.
 * NO magic numbers elsewhere in the codebase.
 */

// ============================================================================
// LEAVE POLICIES
// ============================================================================

export const LEAVE_POLICY = {
    MAX_DURATION_DAYS: 30,         // Maximum leave duration
    MAX_ADVANCE_DAYS: 30,          // Maximum days in advance to apply
    DEFAULT_PL_BALANCE: 17,        // Default Paid Leave balance
    DEFAULT_CO_BALANCE: 0,         // Default Compensatory Off balance
};

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================

export const NOTIFICATION_SETTINGS = {
    BATCH_SIZE: 500,               // Max FCM tokens per batch (Firebase limit)
    RETRY_ATTEMPTS: 3,             // Retry failed sends
    TIMEOUT_MS: 30000,             // Notification send timeout
};

// ============================================================================
// AUTH & SESSION
// ============================================================================

export const AUTH_SETTINGS = {
    SESSION_TIMEOUT_MS: 5000,      // Auth state resolution timeout
    TOKEN_REFRESH_INTERVAL_MS: 3600000, // 1 hour (FCM token refresh)
};

// ============================================================================
// UI SETTINGS
// ============================================================================

export const UI_SETTINGS = {
    CONFETTI_PARTICLE_COUNT: 150,  // Celebration confetti particles
    TOAST_DURATION_MS: 3000,       // Toast notification duration
    MODAL_ANIMATION_MS: 200,       // Modal transition duration
};

// ============================================================================
// DATABASE PATHS (Schema Reference)
// ============================================================================

export const DB_PATHS = {
    EMPLOYEES: 'employees',                              // /employees/{uid}
    EMPLOYEE_PROFILE: 'employees/{uid}/profile',         // Employee profile
    EMPLOYEE_ATTENDANCE: 'employees/{uid}/attendance',   // Employee attendance records
    ATTENDANCE: 'attendance',                            // Global attendance (MD view)
    LEAVES: 'leaves',                                    // Leave requests
    DEVICE_TOKENS: 'deviceTokens',                       // FCM tokens
    AUDIT: 'audit',                                      // Audit logs

    // Legacy path (deprecated - do not use)
    USERS_LEGACY: 'users',                               // ⚠️ DEPRECATED: Use EMPLOYEES
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
    // Attendance
    MARK_ATTENDANCE: '/api/attendance/mark',
    UPDATE_ATTENDANCE_STATUS: '/api/attendance/status',

    // Leave
    APPLY_LEAVE: '/api/leave/apply',
    APPROVE_LEAVE: '/api/leave/approve',
    REJECT_LEAVE: '/api/leave/reject',
    CANCEL_LEAVE: '/api/leave/cancel',

    // Notifications
    FCM_REGISTER: '/api/fcm/register',
    FCM_UNREGISTER: '/api/fcm/unregister',
    FCM_BROADCAST: '/api/fcm/broadcast',

    // Dashboard
    DASHBOARD_STATS: '/api/dashboard/stats',
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION = {
    MIN_EMPLOYEE_NAME_LENGTH: 2,
    MAX_EMPLOYEE_NAME_LENGTH: 100,
    MIN_PASSWORD_LENGTH: 8,
    PHONE_NUMBER_LENGTH: 10,       // Indian phone numbers
};

// ============================================================================
// DATE FORMATS
// ============================================================================

export const DATE_FORMATS = {
    ISO_DATE: 'YYYY-MM-DD',        // Database storage format
    DISPLAY_DATE: 'MMM dd, yyyy',  // UI display format
    DISPLAY_TIME: 'hh:mm a',       // Time display format
    DISPLAY_DATETIME: 'MMM dd, yyyy hh:mm a',
};
