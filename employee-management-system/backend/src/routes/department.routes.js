const { Router } = require('express');
const ctrl = require('../controllers/department.controller');
const { createDepartmentValidator, updateDepartmentValidator } = require('../validators/department.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.getAll);                                            // All roles can view
router.get('/:id', ctrl.getById);
router.post('/', authorize('ADMIN'), createDepartmentValidator, validate, ctrl.create);
router.put('/:id', authorize('ADMIN'), updateDepartmentValidator, validate, ctrl.update);
router.patch('/:id', authorize('ADMIN'), updateDepartmentValidator, validate, ctrl.update);
router.delete('/:id', authorize('ADMIN'), ctrl.remove);

module.exports = router;

