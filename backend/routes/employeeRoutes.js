const express = require('express');
const router = express.Router();
const { createEmployee, getAllEmployees, getEmployeeById } = require('../controllers/employeeController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/employees/create
 * @desc    Create a new employee
 * @access  Private (Admin/Manager)
 */
router.post('/create', verifyToken, createEmployee);

/**
 * @route   GET /api/employees
 * @desc    Get all employees
 * @access  Private (Admin/Manager)
 */
router.get('/', verifyToken, getAllEmployees);

/**
 * @route   GET /api/employees/:id
 * @desc    Get employee by ID
 * @access  Private
 */
router.get('/:id', verifyToken, getEmployeeById);

module.exports = router;
