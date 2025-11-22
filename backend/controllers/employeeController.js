const { db } = require('../config/firebaseConfig');

/**
 * @desc    Create a new employee
 * @route   POST /api/employees
 * @access  Private (Admin/Manager)
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
const createEmployee = async (req, res) => {
    try {
        const { name, email, role, department, designation } = req.body;

        // Basic validation
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and Email are required fields.'
            });
        }

        // Reference to the 'employees' node in Firebase Realtime Database
        const newEmployeeRef = db.ref('employees').push();

        // Set employee data
        await newEmployeeRef.set({
            name,
            email,
            role: role || 'Employee', // Default role is Employee
            department: department || 'General',
            designation: designation || 'Staff',
            createdAt: new Date().toISOString(),
            stats: {
                totalPresent: 0,
                totalLeaves: 0
            }
        });

        // Respond with success message and the new employee ID
        res.status(201).json({
            success: true,
            id: newEmployeeRef.key,
            message: 'Employee created successfully.'
        });

    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error. Failed to create employee.',
            error: error.message
        });
    }
};

/**
 * @desc    Get all employees
 * @route   GET /api/employees
 * @access  Private (Admin/Manager)
 */
const getAllEmployees = async (req, res) => {
    try {
        // Fetch all data from 'employees' node
        const snapshot = await db.ref('employees').once('value');
        const employees = snapshot.val();

        res.status(200).json({
            success: true,
            data: employees || {}
        });

    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error. Failed to fetch employees.',
            error: error.message
        });
    }
};

/**
 * @desc    Get single employee by ID
 * @route   GET /api/employees/:id
 * @access  Private
 */
const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch specific employee data
        const snapshot = await db.ref(`employees/${id}`).once('value');
        const employee = snapshot.val();

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: employee
        });

    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error. Failed to fetch employee.',
            error: error.message
        });
    }
};

module.exports = { createEmployee, getAllEmployees, getEmployeeById };
