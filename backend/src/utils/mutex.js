const { db } = require('../config/firebase');

/**
 * Distributed Lock (Mutex) for User Critical Sections
 * Prevents race conditions between Attendance and Leave controllers.
 */
class Mutex {
    constructor(uid) {
        this.uid = uid;
        this.ref = db.ref(`locks/${uid}`);
        this.hasLock = false;
    }

    /**
     * Try to acquire lock.
     * @param {number} timeoutMs - Max time to hold lock (safety valve)
     * @returns {Promise<boolean>}
     */
    async acquire(timeoutMs = 5000) {
        try {
            const now = Date.now();
            const result = await this.ref.transaction((current) => {
                if (current) {
                    // Lock exists. Check if expired.
                    if (now - current > timeoutMs) {
                        return now; // Steal lock
                    }
                    return undefined; // Abort
                }
                return now; // Acquire
            });

            this.hasLock = result.committed;
            return this.hasLock;
        } catch (error) {
            console.error('[Mutex] Acquire Error:', error);
            return false;
        }
    }

    /**
     * Release the lock.
     */
    async release() {
        if (this.hasLock) {
            try {
                await this.ref.remove();
                this.hasLock = false;
            } catch (error) {
                console.error('[Mutex] Release Error:', error);
            }
        }
    }
}

module.exports = Mutex;
