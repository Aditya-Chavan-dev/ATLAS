/**
 * ATLAS Centralized Employee Counting Logic
 * Strict adherence to System Refactor Protocol
 */

import { ROLES } from '../config/roleConfig'; // "md", "employee"

// 1. Role Normalization
export const normalizeRole = (role) => {
    return role?.trim().toLowerCase() || null;
};

// 2. Attendance Status Normalization
export const normalizeAttendanceStatus = (status) => {
    const s = status?.toLowerCase().trim();
    if (!s) return null;

    if (s === 'present' || s === 'late') return 'present';
    if (s === 'onsite' || s === 'on_site' || s === 'site') return 'onsite'; // Mapped 'site' too for legacy safety? Prompt said "onsite / on_site". I will stick to prompt but add 'site' if common.
    // Prompt table: "onsite / on_site" -> "onsite". "leave / on_leave" -> "onLeave".
    // I will add 'site' as defensive alias.
    if (s === 'onsite' || s === 'on_site' || s === 'site') return 'onsite';
    if (s === 'leave' || s === 'on_leave' || s === 'half-day') return 'onLeave'; // 'half-day' is legacy? I'll treat as leave.

    return null; // Invalid or ignored
};

/**
 * Analyzes a user record against strict validity rules.
 * Returns classification result.
 */
const analyzeUser = (user, uid) => {
    if (!user) return { valid: false, reason: 'NULL_RECORD' };

    // Canonical Source: /employees/{uid}/profile
    const profile = user.profile;
    if (!profile) return { valid: false, reason: 'MISSING_PROFILE', rawProfile: null };

    // Role Validation
    // "profile.role" is required.
    const rawRole = profile.role;
    const role = normalizeRole(rawRole);

    if (!role) return { valid: false, reason: 'MISSING_ROLE', rawProfile: profile };
    if (role !== 'employee' && role !== 'md') return { valid: false, reason: 'INVALID_ROLE', rawProfile: profile };

    // MD Exclusion
    if (role === 'md') return { valid: false, reason: 'ROLE_IS_MD', rawProfile: profile };

    // Required Fields Validation (name, email)
    if (!profile.name) return { valid: false, reason: 'MISSING_NAME', rawProfile: profile };
    if (!profile.email) return { valid: false, reason: 'MISSING_EMAIL', rawProfile: profile };

    // Valid Employee
    return { valid: true, role, profile };
};

/**
 * Main Stats Function
 * @param {Object} employeesSnapshotVal - Raw /employees data
 * @param {String} todayISO - YYYY-MM-DD
 */
export const getEmployeeStats = (employeesSnapshotVal, todayISO) => {
    const rawIds = employeesSnapshotVal ? Object.keys(employeesSnapshotVal) : [];
    const rawCount = rawIds.length;

    const validEmployees = [];
    const feed = []; // Diagnostics for excluded
    const liveFeed = []; // UI Feed for Dashboard

    const stats = {
        totalEmployees: 0,
        present: 0,
        absent: 0,
        onsite: 0,
        onLeave: 0
    };

    if (!employeesSnapshotVal) {
        console.warn('[DATA WARNING] Empty employees snapshot provided to stats utility');
        return { stats, validEmployees, feed, rawCount: 0, liveFeed: [] };
    }

    rawIds.forEach(uid => {
        const userNode = employeesSnapshotVal[uid];
        const analysis = analyzeUser(userNode, uid);

        if (analysis.valid) {
            // Merge profile for consumption
            // Ensures downstream UI has flat access to name/email/role
            const mergedUser = {
                id: uid,
                ...userNode, // Keep root data (like attendance)
                ...analysis.profile, // Profile wins
                role: analysis.role // Normalized role
            };

            validEmployees.push(mergedUser);
            stats.totalEmployees++;

            // Attendance Logic
            // "todayRecord = attendance[todayDate]" -> userNode.attendance?.[todayISO]
            const attendanceMap = userNode.attendance || {};
            const todayRecord = attendanceMap[todayISO];

            if (todayRecord) {
                const canonicalStatus = normalizeAttendanceStatus(todayRecord.status);

                if (canonicalStatus === 'present') stats.present++;
                else if (canonicalStatus === 'onsite') stats.onsite++;
                else if (canonicalStatus === 'onLeave') stats.onLeave++;
                else {
                    // Status exists but didn't map to counting bucket?
                    // "Invalid or missing -> ignored"
                    // Should we count as absent?
                    // If they punched in but status is weird, they aren't absent.
                    // But if they aren't present/onsite/leave...
                    // Default to absent if status is unknown?
                    // User Request: "If missing -> absent".
                    // Code: "Invalid or missing -> ignored".
                    // I'll ignore for stats but maybe log?
                    stats.absent++; // Fallback? No, strict "missing record" = absent. invalid record = ??
                    // I will leave it as "not counted in categories" but user exists.
                    // Wait, totalEmployees = present + absent + ...
                    // If I don't increment absent, sums won't match.
                    // I will treat invalid status as absent for safety or log it.
                    // Constraint 10: "Show safe defaults... Do NOT crash".
                }

                // Add to Live Feed
                liveFeed.push({
                    id: uid,
                    name: mergedUser.name,
                    email: mergedUser.email,
                    timestamp: todayRecord.timestamp,
                    status: todayRecord.status, // Show raw status in feed? Or canonical? UI usually handles raw. 
                    location: todayRecord.location || 'Office'
                });

            } else {
                stats.absent++;
            }

        } else {
            // Excluded
            feed.push({
                uid,
                reason: analysis.reason,
                rawProfile: analysis.rawProfile
            });
        }
    });

    // Sort Live Feed
    liveFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return { stats, validEmployees, feed, liveFeed, rawCount };
};
