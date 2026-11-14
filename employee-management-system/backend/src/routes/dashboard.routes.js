const { Router } = require('express');
const ctrl = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

router.get('/stats', authenticate, authorize('ADMIN'), ctrl.getStats);

module.exports = router;

