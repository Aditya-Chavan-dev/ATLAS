const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const { errorHandler } = require('./services/errorHandler');

const app = express();

app.use(cors());
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
