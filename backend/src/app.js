const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const CacheService = require('./services/cacheService');

const app = express();

app.use(cors());
app.use(express.json());

// Mount API Routes
app.use('/api', apiRoutes);

// Root Health Check (Wakes up backend)
app.get('/health', (req, res) => {
    res.json({ status: 'active', message: 'Backend is awake ⚡' });
});

app.get('/', (req, res) => {
    res.json({ status: 'active', message: 'ATLAS Backend Service' });
});

// Warmup Cache on Start (Fire and Forget)
CacheService.warmUp();

module.exports = app;
