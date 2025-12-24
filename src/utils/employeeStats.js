/**
 * ATLAS Centralized Employee Counting Logic ("The Brain")
 * STRICT SSOT IMPLEMENTATION - DO NOT MODIFY WITHOUT APPROVAL
 * 
 * Responsibilities:
 * 1. Defines "Who is an employee" (isValidEmployee)
 * 2. Calculates authoritative counts (getEmployeeStats)
 * 3. Sanitizes input data before UI consumption
 */

import { ATTENDANCE_STATUS, USER_ROLE, normalizeAttendanceStatus } from '../config/vocabulary';

// 1. Authorization Constants
const VALID_ROLES = [USER_ROLE.EMPLOYEE]; // MD is excluded from "Employee Counts"

// 2. Normalization Helpers
export const normalizeRole = (role) => role?.trim().toLowerCase() || null;

// Use canonical normalization from vocabulary
export { normalizeAttendanceStatus } from '../config/vocabulary';


/**
 * CORE VALIDATION LOGIC
 * Determines if a record represents a valid, active employee.
 * 
 * @param {Object} profile - The user profile object
 * @returns {Object} { valid: boolean, reason: string|null }
 */
export const isValidEmployee = (profile) => {
    if (!profile) return { valid: false, reason: 'MISSING_PROFILE' };

    // 1. Role Check
    const role = normalizeRole(profile.role);
    if (!role) return { valid: false, reason: 'MISSING_ROLE' };

    // MD is NOT an "Employee" for counting purposes
    if (role === USER_ROLE.MD) return { valid: false, reason: 'ROLE_IS_MD' };

    // Strict Role Validation
    if (!VALID_ROLES.includes(role)) return { valid: false, reason: `INVALID_ROLE_${role.toUpperCase()}` };

    // 2. Identity Check
    if (!profile.name?.trim()) return { valid: false, reason: 'MISSING_NAME' };
    if (!profile.email?.trim()) return { valid: false, reason: 'MISSING_EMAIL' };

    // 3. Success
    return { valid: true, reason: null };
};

/**
 * MAIN STATS CALCULATOR
 * The only source of truth for dashboard numbers.
 * 
 * @param {Object} employeesSnapshotVal - Raw /employees data from Firebase
 * @param {String} todayISO - YYYY-MM-DD
 */
export const getEmployeeStats = (employeesSnapshotVal, todayISO) => {
    // 1. Initialize result structure
    const result = {
        rawCount: 0,
        validEmployees: [],
        stats: {
            totalEmployees: 0,
            present: 0,
            absent: 0,
            onsite: 0,
            onLeave: 0
        },
        diagnostics: {
            ignoredProfiles: [],
            reasonCounts: {}
        },
        liveFeed: [] // For Dashboard Stream
    };

    if (!employeesSnapshotVal) return result;

    const rawIds = Object.keys(employeesSnapshotVal);
    result.rawCount = rawIds.length;

    // 2. Iterate and Validate
    rawIds.forEach(uid => {
        const userNode = employeesSnapshotVal[uid];
        const profile = userNode?.profile;

        // AUTH CHECK
        const { valid, reason } = isValidEmployee(profile);

        if (valid) {
            // --- VALID EMPLOYEE ---
            result.stats.totalEmployees++;

            // Merge Data for UI Consumption (Flattening)
            const mergedUser = {
                id: uid,
                uid: uid, // Support both access patterns
                ...profile, // Profile is source of true identity
                phone: profile.phone || '', // Safe default
                source: 'employees' // Metadata
            };
            result.validEmployees.push(mergedUser);

            // Attendance Check (Does not affect existence)
            const attendanceMap = userNode.attendance || {};
            const todayRecord = attendanceMap[todayISO];

            if (todayRecord) {
                const status = normalizeAttendanceStatus(todayRecord.status);

                if (status === 'present') result.stats.present++;
                else if (status === 'onsite') result.stats.onsite++;
                else if (status === 'onLeave') result.stats.onLeave++;
                else {
                    // Unknown status -> count as absent/no-status
                    result.stats.absent++;
                }

                // Add to Live Feed
                result.liveFeed.push({
                    id: uid,
                    name: mergedUser.name,
                    email: mergedUser.email,
                    timestamp: todayRecord.timestamp,
                    status: todayRecord.status, // Raw status for UI display
                    location: todayRecord.location || 'Office'
                });

            } else {
                // No record -> Absent
                result.stats.absent++;
            }

        } else {
            // --- IGNORED RECORD ---
            result.diagnostics.ignoredProfiles.push({ uid, reason });
            result.diagnostics.reasonCounts[reason] = (result.diagnostics.reasonCounts[reason] || 0) + 1;
        }
    });

    // Sort Streams
    result.liveFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    result.validEmployees.sort((a, b) => a.name.localeCompare(b.name));

    return result;
};
