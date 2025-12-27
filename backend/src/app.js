const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const { errorHandler } = require('./services/errorHandler');

const app = express();

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

// Mount API Routes
app.use('/api', apiRoutes);

// Root Health Check
app.get('/', (req, res) => {
    res.json({ status: 'active', message: 'ATLAS Backend Service' });
});

// Centralized Error Handler (MUST be last middleware)
app.use(errorHandler);

module.exports = app;
