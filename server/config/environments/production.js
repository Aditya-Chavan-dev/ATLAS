module.exports = {
    name: 'production',
    security: {
        sessionTimeout: 60 * 60 * 1000, // 1 hour strict
        enableRevocationCheck: true,
        failClosed: true
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 1000,
        authMax: 5 // Strict login limits
    },
    logging: {
        level: 'info'
    }
};
