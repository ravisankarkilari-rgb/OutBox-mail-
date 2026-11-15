const { Router } = require('express');
const { login, googleLogin, connectGoogleOAuth, register, refreshToken, getMe, logout } = require('../controllers/auth.controller');
const { loginValidator, registerValidator } = require('../validators/auth.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

router.post('/login', loginValidator, validate, login);
router.post('/google', googleLogin);
router.post('/google/connect', authenticate, connectGoogleOAuth);
router.post('/register', registerValidator, validate, register);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;

