const jwt = require('jsonwebtoken');
const { jwtSecret, refreshSecret } = require('../config/constants');

const generateAccessToken = (payload) =>
  jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, refreshSecret, { expiresIn: '30d' });

const verifyAccessToken = (token) => jwt.verify(token, jwtSecret);

const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret);

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };

