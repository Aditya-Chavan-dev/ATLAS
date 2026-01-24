/**
 * PURPOSE: Collect auth/security metrics
 * SCOPE: Login success/failure, rate limits, blacklist size
 * INTEGRATION: Exports to monitoring service (Prometheus/Datadog) or logs for now
 */

class MetricsCollector {
    constructor() {
        // In-memory counters (reset on restart)
        this.metrics = {
            auth: {
                success: 0,
                failure: 0,
                latencySum: 0,
                latencyCount: 0
            },
            security: {
                rateLimitHits: {},
                blacklistAdds: 0,
                revocations: 0
            }
        };
    }

    /**
     * Track authentication metrics
     */
    recordAuthMetric(type, success, latencyMs) {
        if (success) {
            this.metrics.auth.success++;
            if (latencyMs) {
                this.metrics.auth.latencySum += latencyMs;
                this.metrics.auth.latencyCount++;
            }
        } else {
            this.metrics.auth.failure++;
        }
    }

    /**
     * Track rate limit hits
     */
    recordRateLimitHit(endpoint, ip) {
        if (!this.metrics.security.rateLimitHits[endpoint]) {
            this.metrics.security.rateLimitHits[endpoint] = 0;
        }
        this.metrics.security.rateLimitHits[endpoint]++;
    }

    /**
     * Track security events
     */
    recordSecurityEvent(type) {
        if (type === 'blacklist_add') this.metrics.security.blacklistAdds++;
        if (type === 'revoke_tokens') this.metrics.security.revocations++;
    }

    /**
     * Get snapshot for scraping endpoint
     */
    getMetrics() {
        const avgLatency = this.metrics.auth.latencyCount > 0
            ? Math.round(this.metrics.auth.latencySum / this.metrics.auth.latencyCount)
            : 0;

        return {
            ...this.metrics,
            auth: {
                ...this.metrics.auth,
                avgLatencyMs: avgLatency
            },
            timestamp: Date.now()
        };
    }
}

module.exports = new MetricsCollector();
