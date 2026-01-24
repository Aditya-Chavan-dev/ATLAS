/**
 * PURPOSE: Define alert thresholds and conditions
 */

module.exports = {
    // Critical alerts (immediate response required)
    critical: {
        massAccountCompromise: {
            condition: 'failed_logins > 1000 in 5 minutes',
            action: 'page_on_call_engineer',
            threshold: 1000,
            windowSeconds: 300
        },
        ddosAttack: {
            condition: 'requests_per_second > 1000',
            action: 'enable_emergency_rate_limiting',
            threshold: 1000,
            windowSeconds: 1
        }
    },

    // Warning alerts (investigate within 1 hour)
    warning: {
        suspiciousLoginPattern: {
            condition: 'failed_logins > 100 in 1 hour',
            action: 'notify_security_team',
            threshold: 100,
            windowSeconds: 3600
        },
        blacklistGrowth: {
            condition: 'blacklist_size > 5000',
            action: 'review_blacklist_entries',
            threshold: 5000
        }
    }
};
