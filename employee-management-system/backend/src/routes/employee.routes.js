const { Router } = require('express');
const ctrl = require('../controllers/employee.controller');
const { createEmployeeValidator, updateEmployeeValidator, employeeQueryValidator } = require('../validators/employee.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// All routes require authentication
router.use(authenticate);

// Employee self-access
router.get('/me', ctrl.getMyProfile);
router.patch('/me', ctrl.selfUpdate);

// Admin-only routes
router.get('/', authorize('ADMIN'), employeeQueryValidator, validate, ctrl.getAll);
router.post('/', authorize('ADMIN'), createEmployeeValidator, validate, ctrl.create);
router.get('/:id', authorize('ADMIN'), ctrl.getById);
router.put('/:id', authorize('ADMIN'), updateEmployeeValidator, validate, ctrl.update);
router.patch('/:id', authorize('ADMIN'), updateEmployeeValidator, validate, ctrl.update);
router.delete('/:id', authorize('ADMIN'), ctrl.remove);

module.exports = router;

