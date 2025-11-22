const fetch = require('node-fetch'); // Or use native fetch if Node 18+

const API_URL = 'http://127.0.0.1:5000/api';

async function runTest() {
    console.log('🚀 Starting API Verification...\n');

    try {
        // 1. Health Check
        console.log('1. Verifying Server Health...');
        const healthRes = await fetch(`${API_URL}/health`);
        const healthData = await healthRes.json();
        console.log('Health Status:', healthData);

        if (healthData.status !== 'OK') throw new Error('Server health check failed');
        console.log('✅ Server is Healthy\n');

        // 2. Security Check (Unauthorized Access)
        console.log('2. Verifying Security (Unauthorized Access)...');
        const protectedRes = await fetch(`${API_URL}/attendance/mark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'data' })
        });

        if (protectedRes.status === 401 || protectedRes.status === 403) {
            console.log('✅ Security Verified: Unauthorized access correctly blocked (Status 401/403)\n');
        } else {
            throw new Error(`Security Breach: Protected endpoint returned status ${protectedRes.status}`);
        }

        console.log('🎉 All Verification Tests Passed Successfully!');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('API Error:', await error.response.text());
        }
    }
}

// Check if fetch is available (Node 18+)
if (!globalThis.fetch) {
    console.log('Installing node-fetch...');
    require('child_process').execSync('npm install node-fetch');
    globalThis.fetch = require('node-fetch');
}

runTest();
