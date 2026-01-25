import './env'; // Ensure env vars are loaded before pool is created
import { Pool } from 'pg';

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err: Error) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

export const checkDatabaseConnection = async (): Promise<void> => {
    try {
        const client = await pool.connect();
        client.release();
        console.log('✅ Database connected successfully.');
    } catch (error) {
        console.error('❌ FATAL ERROR: Could not connect to database.', error);
        process.exit(1);
    }
};
