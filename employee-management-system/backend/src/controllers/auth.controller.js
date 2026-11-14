const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return sendSuccess(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { credential, demoUser } = req.body;
    const result = await authService.googleAuth(credential, demoUser);
    return sendSuccess(res, result, 'Google authentication successful');
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const user = await authService.register(email, password, role);
    return sendSuccess(res, user, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 'Refresh token required', 400);
    const result = await authService.refreshToken(refreshToken);
    return sendSuccess(res, result, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return sendSuccess(res, user, 'Profile fetched');
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  // JWT is stateless; client removes the token
  return sendSuccess(res, null, 'Logged out successfully');
};

module.exports = { login, googleLogin, register, refreshToken, getMe, logout };

