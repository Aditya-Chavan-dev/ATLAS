const { db, admin } = require('../config/firebase');

/**
 * DEEP HEALTH CHECK
 * Verifies:
 * 1. Express App (implicit if this runs)
 * 2. Firebase Database Connectivity
 * 3. System Time/Uptime
 */
exports.checkHealth = async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            database: { status: 'unknown', latency: 0 },
            server: { status: 'ok', pid: process.pid }
        }
    };

    try {
        const start = Date.now();
        // Lightweight read to verify connectivity
        await db.ref('.info/connected').once('value');
        // Note: .info/connected tracks client connection state, which might be null in Admin SDK sometimes.
        // Better to read a tiny static path or just root shallow.
        // Actually, just reading *anything* proves we can reach the DB server.
        await db.ref('server_status_check').set({ last_checked: start });

        const latency = Date.now() - start;
        health.services.database = { status: 'connected', latency: `${latency}ms` };
    } catch (error) {
        health.status = 'degraded';
        health.services.database = { status: 'disconnected', error: error.message };
        console.error('[Health] Database check failed:', error);
        return res.status(503).json(health); // 503 Service Unavailable
    }

    res.json(health);
};
