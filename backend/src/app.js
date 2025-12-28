const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const compression = require('compression');
const apiRoutes = require('./routes/api');
const { errorHandler } = require('./services/errorHandler');

const app = express();

// SECURITY: Hardening
app.use(helmet()); // Secure HTTP headers
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
const rateLimit = require('express-rate-limit');

// General API limit: 100 requests per 15 minutes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later.', code: 'RATE_LIMITED' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict limit for sensitive operations: 20 requests per 15 minutes
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many sensitive requests, please slow down.', code: 'RATE_LIMITED_STRICT' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply general limiter to all API routes
app.use('/api', generalLimiter);

// Apply strict limiter to sensitive routes
app.use('/api/auth', strictLimiter);
app.use('/api/fcm/broadcast', strictLimiter);
app.use('/api/system', strictLimiter);

// Mount API Routes
app.use('/api', apiRoutes);

// Root Health Check
app.get('/', (req, res) => {
    res.json({ status: 'active', message: 'ATLAS Backend Service' });
});

// Centralized Error Handler (MUST be last middleware)
app.use(errorHandler);

module.exports = app;
