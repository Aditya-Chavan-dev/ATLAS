import './env';

const requiredEnvVars = [
    'DATABASE_URL',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'ROOT_OWNER_EMAIL',
    'PORT',
    'NODE_ENV',
    'PENDING_USER_TTL_DAYS',
];

export const validateEnv = (): void => {
    const missingVars: string[] = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missingVars.push(envVar);
        }
    }

    if (missingVars.length > 0) {
        console.error('❌ FATAL ERROR: Missing required environment variables:');
        missingVars.forEach((v) => console.error(`   - ${v}`));
        process.exit(1);
    }

    if (!process.env.ROOT_OWNER_EMAIL || process.env.ROOT_OWNER_EMAIL.trim() === '') {
        console.error('❌ FATAL ERROR: ROOT_OWNER_EMAIL cannot be empty.');
        process.exit(1);
    }

    console.log('✅ Environment variables validated.');
};
