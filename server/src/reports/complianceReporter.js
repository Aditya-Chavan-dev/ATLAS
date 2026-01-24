/**
 * PURPOSE: Generate compliance reports
 * SCOPE: Access logs, role changes, security events
 * FREQUENCY: On-demand
 */
const { db } = require('../../config/firebase');

class ComplianceReporter {
    /**
     * Generate security event report
     * Lists all security incidents and responses
     */
    async generateSecurityReport(startDate, endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        console.log(`Generating Security Report from ${startDate} to ${endDate}...`);

        try {
            const auditSnap = await db.ref('audit')
                .orderByChild('timestamp')
                .startAt(start)
                .endAt(end)
                .once('value');

            const logs = [];
            auditSnap.forEach(snap => {
                logs.push(snap.val());
            });

            // Filter for critical events
            const securityEvents = logs.filter(l =>
                ['user_suspended', 'role_changed', 'revoke_tokens', 'blacklist_add'].includes(l.eventType) ||
                (l.action && l.action.includes('security'))
            );

            return {
                generatedAt: new Date().toISOString(),
                period: { start: startDate, end: endDate },
                totalEvents: logs.length,
                securityIncidents: securityEvents.length,
                incidents: securityEvents
            };

        } catch (error) {
            console.error('Report generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate role change report
     * Lists all authorization changes
     */
    async generateRoleChangeReport(days = 30) {
        const end = Date.now();
        const start = end - (days * 24 * 60 * 60 * 1000);

        try {
            const auditSnap = await db.ref('audit')
                .orderByChild('timestamp')
                .startAt(start)
                .endAt(end)
                .once('value');

            const logs = [];
            auditSnap.forEach(snap => {
                const val = snap.val();
                if (val.eventType === 'authz_event' && val.action === 'role_changed') {
                    logs.push(val);
                }
            });

            return {
                periodDays: days,
                changes: logs
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ComplianceReporter();
