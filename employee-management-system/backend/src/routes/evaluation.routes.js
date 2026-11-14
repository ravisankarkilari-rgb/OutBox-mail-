const { Router } = require('express');
const ctrl = require('../controllers/evaluation.controller');
const { createEvaluationValidator, updateEvaluationValidator } = require('../validators/evaluation.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN'), ctrl.getAll);
router.get('/employee/:employeeId', ctrl.getByEmployee);
router.get('/employee/:employeeId/stats', ctrl.getStats);
router.get('/:id', ctrl.getById);
router.post('/', authorize('ADMIN'), createEvaluationValidator, validate, ctrl.create);
router.put('/:id', authorize('ADMIN'), updateEvaluationValidator, validate, ctrl.update);
router.patch('/:id', authorize('ADMIN'), updateEvaluationValidator, validate, ctrl.update);
router.delete('/:id', authorize('ADMIN'), ctrl.remove);

module.exports = router;

