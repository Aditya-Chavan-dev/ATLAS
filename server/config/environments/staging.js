module.exports = {
    name: 'staging',
    security: {
        sessionTimeout: 60 * 60 * 1000,
        enableRevocationCheck: true,
        failClosed: true
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 1000,
        authMax: 10
    },
    logging: {
        level: 'info'
    }
};
