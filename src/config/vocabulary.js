/**
 * ATLAS CANONICAL VOCABULARY
 * SINGLE SOURCE OF TRUTH FOR ALL STATUS VALUES
 * 
 * CRITICAL: This file is the ONLY source for status strings.
 * All layers (DB, Backend, Frontend) MUST import from here.
 * 
 * DO NOT create status strings elsewhere.
 */

// ============================================================================
// ATTENDANCE STATUS
// ============================================================================

export const ATTENDANCE_STATUS = {
    // Database-level statuses (written to Firebase)
    PENDING: 'pending',                    // Awaiting MD review
    PENDING_CO: 'pending_co',              // Worked on holiday/Sunday (awaiting approval)
    APPROVED: 'approved',                  // MD approved (maps to PRESENT for display)
    REJECTED: 'rejected',                  // MD rejected
    CORRECTION_PENDING: 'correction_pending', // Employee requested correction

    // Display statuses (UI layer only - never written to DB)
    PRESENT: 'present',                    // Normalized from 'approved' for display
    LATE: 'late',                          // UI-only (not stored)
    ABSENT: 'absent',                      // Derived from missing record (not stored)
};

// Status transitions (enforcement rules)
export const ATTENDANCE_TRANSITIONS = {
    [ATTENDANCE_STATUS.PENDING]: [ATTENDANCE_STATUS.APPROVED, ATTENDANCE_STATUS.REJECTED],
    [ATTENDANCE_STATUS.PENDING_CO]: [ATTENDANCE_STATUS.APPROVED, ATTENDANCE_STATUS.REJECTED],
    [ATTENDANCE_STATUS.APPROVED]: [ATTENDANCE_STATUS.CORRECTION_PENDING], // Immutable unless correction
    [ATTENDANCE_STATUS.REJECTED]: [ATTENDANCE_STATUS.CORRECTION_PENDING],
    [ATTENDANCE_STATUS.CORRECTION_PENDING]: [ATTENDANCE_STATUS.APPROVED, ATTENDANCE_STATUS.REJECTED],
};

// UI Labels (for StatusBadge component)
export const ATTENDANCE_LABELS = {
    [ATTENDANCE_STATUS.PENDING]: 'Pending',
    [ATTENDANCE_STATUS.PENDING_CO]: 'Pending CO',
    [ATTENDANCE_STATUS.APPROVED]: 'Present',      // Display "Present" for approved
    [ATTENDANCE_STATUS.REJECTED]: 'Rejected',
    [ATTENDANCE_STATUS.CORRECTION_PENDING]: 'Correction Pending',
    [ATTENDANCE_STATUS.PRESENT]: 'Present',       // Display label
    [ATTENDANCE_STATUS.LATE]: 'Late',             // Display label
    [ATTENDANCE_STATUS.ABSENT]: 'Absent',         // Display label
};

// ============================================================================
// LEAVE STATUS
// ============================================================================

export const LEAVE_STATUS = {
    PENDING: 'pending',           // Awaiting MD review
    APPROVED: 'approved',         // MD approved
    REJECTED: 'rejected',         // MD rejected
    CANCELLED: 'cancelled',       // Employee cancelled
    AUTO_BLOCKED: 'auto_blocked', // System blocked (attendance conflict)
};

// Leave type
export const LEAVE_TYPE = {
    PL: 'PL',                     // Paid Leave
    CO: 'CO',                     // Compensatory Off
    NATIONAL_HOLIDAY: 'National Holiday', // System-generated
};

// ============================================================================
// LOCATION TYPE
// ============================================================================

export const LOCATION_TYPE = {
    OFFICE: 'Office',
    SITE: 'Site',
};

// ============================================================================
// USER ROLES
// ============================================================================

export const USER_ROLE = {
    EMPLOYEE: 'employee',
    MD: 'md',
    OWNER: 'owner',
};

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export const NOTIFICATION_TYPE = {
    ATTENDANCE_REMINDER: 'ATTENDANCE_REMINDER',
    ATTENDANCE_APPROVED: 'ATTENDANCE_APPROVED',
    ATTENDANCE_REJECTED: 'ATTENDANCE_REJECTED',
    LEAVE_REQUEST: 'LEAVE_REQUEST',
    LEAVE_APPROVED: 'LEAVE_APPROVED',
    LEAVE_REJECTED: 'LEAVE_REJECTED',
    REVIEW_ATTENDANCE: 'REVIEW_ATTENDANCE',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize attendance status from DB value to display value
 * Used by frontend to unify 'approved' → 'present' mapping
 */
export const normalizeAttendanceStatus = (dbStatus) => {
    const normalized = dbStatus?.toLowerCase().trim();

    // Map approved to present for display
    if (normalized === ATTENDANCE_STATUS.APPROVED) {
        return ATTENDANCE_STATUS.PRESENT;
    }

    // Map late to present (business rule: late is a form of present)
    if (normalized === ATTENDANCE_STATUS.LATE) {
        return ATTENDANCE_STATUS.PRESENT;
    }

    // Pass through other valid statuses
    if (Object.values(ATTENDANCE_STATUS).includes(normalized)) {
        return normalized;
    }

    // Unknown status → null (let caller decide how to handle)
    return null;
};

/**
 * Check if status transition is valid
 */
export const isValidTransition = (fromStatus, toStatus) => {
    const allowedTransitions = ATTENDANCE_TRANSITIONS[fromStatus];
    return allowedTransitions?.includes(toStatus) ?? false;
};

/**
 * Get UI label for status
 */
export const getStatusLabel = (status) => {
    return ATTENDANCE_LABELS[status] || status || 'Unknown';
};
