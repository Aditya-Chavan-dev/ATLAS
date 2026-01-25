import { pool } from '../config/database';

export const seedRootOwner = async () => {
    const rootEmail = process.env.ROOT_OWNER_EMAIL;
    if (!rootEmail) throw new Error('ROOT_OWNER_EMAIL is not defined');

    console.log('🔄 Verifying Root Owner existence...');

    // We use a new client to ensure we can control the transaction
    const client = await pool.connect();
    try {
        const checkRes = await client.query('SELECT id, email FROM users WHERE is_root_owner = true');

        if (checkRes.rowCount && checkRes.rowCount > 0) {
            const existing = checkRes.rows[0];
            if (existing.email !== rootEmail) {
                console.warn(`⚠️ WARNING: Configured ROOT_OWNER_EMAIL (${rootEmail}) does not match in-database Root Owner (${existing.email}). Database authority prevails.`);
            } else {
                console.log('✅ Root Owner verification passed.');
            }
            return;
        }

        console.log(`✨ No Root Owner found. Seeding ${rootEmail}...`);

        await client.query('BEGIN');

        await client.query(
            `INSERT INTO users (email, role, is_active, is_root_owner, status)
       VALUES ($1, 'Owner', true, true, 'active')`,
            [rootEmail]
        );

        // Audit log stub
        const eventData = JSON.stringify({ action: 'bootstrap', target: rootEmail });
        await client.query(
            `INSERT INTO audit_logs (user_email, event_type, event_data, result)
       VALUES ($1, 'root_owner_created', $2, 'granted')`,
            ['SYSTEM_BOOTSTRAP', eventData]
        );

        await client.query('COMMIT');
        console.log('✅ Root Owner successfully seeded.');

    } catch (error) {
        await client.query('ROLLBACK');
        // If it's a table missing error, throw it up so server knows to warn about migrations
        throw error;
    } finally {
        client.release();
    }
};

// Allow standalone execution
if (require.main === module) {
    // Database import above already loaded .env, but we should validate
    const { validateEnv } = require('../config/validateEnv');
    validateEnv();

    seedRootOwner()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('❌ Seeding failed:', err);
            process.exit(1);
        });
}
