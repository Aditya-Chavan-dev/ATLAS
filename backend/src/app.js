const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const { errorHandler } = require('./services/errorHandler');

const app = express();

// CORS Configuration - Dynamic origin handling
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
            'https://atlas-011.web.app',
            'https://atlas-011.firebaseapp.com',
            'http://localhost:5173',
            'http://localhost:5174'
        ];

        // Check if origin is allowed or ends with allowed domains
        const isAllowed = allowedOrigins.includes(origin) ||
            origin.endsWith('.web.app') ||
            origin.endsWith('.firebaseapp.com') ||
            origin.endsWith('.onrender.com');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],

    // CRITICAL: Expose headers for file downloads
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],

    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
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
