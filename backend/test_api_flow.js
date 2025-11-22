const fetch = require('node-fetch'); // Or use native fetch if Node 18+

const API_URL = 'http://127.0.0.1:5000/api';

// Test Data
const employee = {
    employeeId: 'test_emp_001',
    type: 'Office',
    siteName: null
};

const md = {
    approvedBy: 'test_md_001'
};

async function runTest() {
    console.log('🚀 Starting API Flow Test...\n');

    try {
        // 1. Mark Attendance
        console.log('1. Marking Attendance...');
        const markRes = await fetch(`${API_URL}/attendance/mark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employee)
        });
        const markData = await markRes.json();
        console.log('Response:', markData);

        if (!markData.success) throw new Error('Failed to mark attendance');
        const attendanceId = markData.data.attendanceId;
        console.log('✅ Attendance Marked. ID:', attendanceId, '\n');

        // 2. Get Pending Approvals
        console.log('2. Fetching Pending Approvals (MD)...');
        const pendingRes = await fetch(`${API_URL}/attendance/pending`);
        const pendingData = await pendingRes.json();
        console.log('Pending Count:', pendingData.data.length);

        const pendingRecord = pendingData.data.find(r => r.attendanceId === attendanceId);
        if (!pendingRecord) throw new Error('New record not found in pending list');
        console.log('✅ Record found in pending list\n');

        // 3. Approve Attendance
        console.log('3. Approving Attendance...');
        const approveRes = await fetch(`${API_URL}/attendance/approve/${attendanceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(md)
        });
        const approveData = await approveRes.json();
        console.log('Response:', approveData);

        if (!approveData.success) throw new Error('Failed to approve attendance');
        console.log('✅ Attendance Approved\n');

        // 4. Verify Status
        console.log('4. Verifying Final Status...');
        const statusRes = await fetch(`${API_URL}/attendance/today?employeeId=${employee.employeeId}`);
        const statusData = await statusRes.json();
        console.log('Status:', statusData.data.status);

        if (statusData.data.status !== 'Approved') throw new Error('Status is not Approved');
        console.log('✅ Final Status Verified: Approved\n');

        console.log('🎉 All Tests Passed Successfully!');

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
