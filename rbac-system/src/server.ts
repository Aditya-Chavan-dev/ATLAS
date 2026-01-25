import express from 'express';
import { validateEnv } from './config/validateEnv';
import { pool, checkDatabaseConnection } from './config/database';
import { seedRootOwner } from './scripts/seedRootOwner';

// Validate environment early
validateEnv();

import adminRoutes from './routes/adminRoutes';

const app = express();
// PORT enforced by validateEnv
const PORT = process.env.PORT;

app.use(express.json());

// Public Health Check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Admin API
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} does not exist`
    });
});

// 500 Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

export { app };

const startApp = async () => {
    await checkDatabaseConnection();

    // Note: Database tables must exist for bootstrap to work.
    // In a real deployment, migrations run before start.
    // We wrap this in a try-catch to be safe, but fail-closed.
    try {
        await seedRootOwner();
    } catch (e: any) {
        if (e.message && e.message.includes('relation "users" does not exist')) {
            console.error("❌ Database schema not found. Please run migrations first.");
            process.exit(1);
        }
        throw e;
    }

    app.listen(PORT, () => {
        console.log(`
🛡️  RBAC System Online
----------------------
- Status: Secure
- Port: ${PORT}
- Environment: ${process.env.NODE_ENV}
- Root Owner: ${process.env.ROOT_OWNER_EMAIL}
    `);

        // Graceful Shutdown Logic
        const shutdown = async (signal: string) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);
            await pool.end(); // Close DB connections
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    });
};

// Only start server if run directly (not imported by Firebase)
if (require.main === module) {
    startApp().catch((err) => {
        console.error('❌ Startup failed:', err);
        process.exit(1);
    });
}
