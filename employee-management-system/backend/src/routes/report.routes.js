const { Router } = require('express');
const ctrl = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/employees', ctrl.getEmployeeReport);
router.get('/employees/export', ctrl.exportCSV);
router.get('/performance', ctrl.getPerformanceReport);

module.exports = router;

