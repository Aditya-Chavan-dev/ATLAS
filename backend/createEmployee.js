const { admin, db } = require('./config/firebaseConfig');

/**
 * Script to add initial employee record to Firebase Realtime Database
 * Run this once to create your employee profile
 */

async function createEmployee() {
    try {
        // Employee details - UPDATE THESE WITH YOUR INFO
        const employeeData = {
            id: 'AcT5TLlTaxMg5PNN6Q16eCRrbDq1', // Your Firebase user ID
            name: 'Aditya Chavan',
            email: 'adityagchavan310@gmail.com',
            role: 'Employee',
            department: 'Engineering',
            joinedDate: new Date().toISOString().split('T')[0]
        };

        // Save to database
        await db.ref(`employees/${employeeData.id}`).set(employeeData);

        console.log('✅ Employee created successfully!');
        console.log('Employee ID:', employeeData.id);
        console.log('Name:', employeeData.name);
        console.log('Email:', employeeData.email);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating employee:', error);
        process.exit(1);
    }
}

createEmployee();
