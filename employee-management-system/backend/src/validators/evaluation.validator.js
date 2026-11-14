const { body } = require('express-validator');

const createEvaluationValidator = [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('evaluationDate').isISO8601().withMessage('Valid evaluation date is required'),
  body('rating')
    .isIn(['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE', 'POOR'])
    .withMessage('Invalid rating'),
  body('score').isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('comments').optional().trim(),
  body('goals').optional().trim(),
  body('achievements').optional().trim(),
  body('evaluatorName').trim().notEmpty().withMessage('Evaluator name is required'),
];

const updateEvaluationValidator = [
  body('evaluationDate').optional().isISO8601().withMessage('Valid evaluation date is required'),
  body('rating')
    .optional()
    .isIn(['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE', 'POOR'])
    .withMessage('Invalid rating'),
  body('score').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be 0-100'),
];

module.exports = { createEvaluationValidator, updateEvaluationValidator };

