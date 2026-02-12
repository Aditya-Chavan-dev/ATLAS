const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const compression = require('compression');
const apiRoutes = require('./routes/api');
const { errorHandler } = require('./services/errorHandler');

const app = express();

// SECURITY: Hardening
app.use(helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginEmbedderPolicy: false
})); // Secure HTTP headers with Auth-friendly COOP/COEP
app.use(hpp());    // Prevent Parameter Pollution
app.use(compression()); // Compress responses

// SECURITY: Restrict CORS to allowed origins only
const allowedOrigins = [
    'https://atlas-011.web.app',
    'https://atlas-011.firebaseapp.com',
    'http://localhost:5173',  // Local dev
    'http://localhost:5174'   // Local dev alternate
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// ============================================
// SECURITY: Rate Limiting
// ============================================
// SECURITY: DDoS Protection & Rate Limiting (V2)
const { checkIPBlacklist, requestSizeLimiter, volumetricThrottler } = require('./security/ddos-protection/ddosProtectionMiddleware');
const { globalLimiter, authLimiter, apiLimiter, mutationLimiter } = require('./security/rate-limiting/rateLimiterMiddleware');

// 1. First Line of Defense: IP Blacklist & Size Limits
app.use(checkIPBlacklist);
app.use(requestSizeLimiter);

// 2. Volumetric Protection (Throttling)
app.use(volumetricThrottler);

// 3. Application Rate Limits
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/fcm/broadcast', mutationLimiter);
app.use('/api/system', mutationLimiter);

// Default API Limiter for other routes
app.use('/api', apiLimiter);

// Apply general limiter to all API routes


// Mount API Routes
app.use('/api', apiRoutes);

// Root Health Check
app.get('/', (req, res) => {
    res.json({ status: 'active', message: 'ATLAS Backend Service' });
});

// Centralized Error Handler (MUST be last middleware)
app.use(errorHandler);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Global Error]', err);

    // Operational errors (trusted)
    if (err.isOperational) {
        return res.status(err.statusCode || 400).json({
            error: err.message,
            code: err.code || 'ERROR'
        });
    }

    // Programming or other unknown errors
    res.status(500).json({
        error: process.env.NODE_ENV === 'development' ? err.message : 'Server error. Please try again later.'
    });
});

module.exports = app;

