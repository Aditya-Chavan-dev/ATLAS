const app = require('./src/app');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Required for Render

console.log('🚀 Starting ATLAS Backend Server...');
console.log('📋 Configuration:', {
    port: PORT,
    host: HOST,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'production'
});

// Start server
const server = app.listen(PORT, HOST, () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('🚀 ATLAS Backend Server is LIVE!');
    console.log('═══════════════════════════════════════════');
    console.log(`📍 URL: http://${HOST}:${PORT}`);
    console.log(`⏰ Server Time: ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════════');
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('⚠️ SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

