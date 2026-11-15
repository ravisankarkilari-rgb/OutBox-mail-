const { Router } = require('express');
const ctrl = require('../controllers/email.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

// All email routes require authentication
router.use(authenticate);

router.post('/schedule', ctrl.scheduleEmail);
router.post('/system-email', ctrl.sendSystemEmail);
router.get(['/', ''], ctrl.getEmails);
router.get('/stats', ctrl.getStats);
router.post('/:id/send-now', ctrl.sendNow);
router.delete('/:id', ctrl.deleteEmail);
router.post('/smtp-config', ctrl.saveSmtp);

module.exports = router;

