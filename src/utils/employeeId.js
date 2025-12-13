/**
 * Employee ID Generator Utility
 * Generates simple auto-incrementing employee IDs like "EMP001", "EMP002", etc.
 */

import { ref, get, set, runTransaction } from 'firebase/database';
import { database } from '../firebase/config';

/**
 * Generate a new employee ID
 * Uses a counter stored in Firebase to ensure unique IDs
 * @returns {Promise<string>} Employee ID in format "EMP001"
 */
export const generateEmployeeId = async () => {
    const counterRef = ref(database, 'system/employeeCounter');

    try {
        // Use a transaction to safely increment the counter
        const result = await runTransaction(counterRef, (currentValue) => {
            // If counter doesn't exist, start at 1
            const newValue = (currentValue || 0) + 1;
            return newValue;
        });

        if (result.committed) {
            const count = result.snapshot.val();
            // Format as EMP001, EMP002, etc. (3 digit padding)
            return `EMP${count.toString().padStart(3, '0')}`;
        } else {
            throw new Error('Transaction not committed');
        }
    } catch (error) {
        console.error('Error generating employee ID:', error);
        // Fallback: use timestamp-based ID
        const timestamp = Date.now().toString().slice(-6);
        return `EMP${timestamp}`;
    }
};

/**
 * Get the current employee counter value
 * @returns {Promise<number>} Current counter value
 */
export const getEmployeeCount = async () => {
    const counterRef = ref(database, 'system/employeeCounter');
    const snapshot = await get(counterRef);
    return snapshot.val() || 0;
};
