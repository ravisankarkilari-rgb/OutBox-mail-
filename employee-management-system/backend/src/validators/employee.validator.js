const { body, query } = require('express-validator');

const createEmployeeValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('departmentId').notEmpty().withMessage('Department is required'),
  body('joiningDate').isISO8601().withMessage('Valid joining date is required'),
  body('salary').isFloat({ min: 0 }).withMessage('Valid salary is required'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'])
    .withMessage('Invalid status'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
];

const updateEmployeeValidator = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty'),
  body('departmentId').optional().notEmpty().withMessage('Department cannot be empty'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Valid salary is required'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'])
    .withMessage('Invalid status'),
];

const employeeQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'])
    .withMessage('Invalid status'),
];

module.exports = { createEmployeeValidator, updateEmployeeValidator, employeeQueryValidator };

