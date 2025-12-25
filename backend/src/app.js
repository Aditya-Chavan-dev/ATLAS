const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const { errorHandler } = require('./services/errorHandler');

const app = express();

// CORS Configuration - Allow Firebase Hosting
app.use(cors({
    origin: ['https://atlas-011.web.app', 'https://atlas-011.firebaseapp.com', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
