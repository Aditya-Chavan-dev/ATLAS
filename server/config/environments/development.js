module.exports = {
    name: 'development',
    security: {
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours for dev comfort
        enableRevocationCheck: true, // Keep on to test flow
        failClosed: false // More verbose errors in dev
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 10000, // Relaxed limits
        authMax: 100
    },
    logging: {
        level: 'debug'
    }
};
