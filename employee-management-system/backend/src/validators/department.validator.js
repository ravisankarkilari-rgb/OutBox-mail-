const { body } = require('express-validator');

const createDepartmentValidator = [
  body('name').trim().notEmpty().withMessage('Department name is required')
    .isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description max 500 characters'),
];

const updateDepartmentValidator = [
  body('name').optional().trim().notEmpty().withMessage('Department name cannot be empty'),
  body('description').optional().trim(),
];

module.exports = { createDepartmentValidator, updateDepartmentValidator };

