const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const { bcryptRounds } = require('../config/constants');

class AuthService {
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { smtpConfig: true },
    });
    if (!user) throw new AppError('Invalid email or password', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Invalid email or password', 401);

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const { password: _, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  }

  async register(email, password, role = 'USER', name = null) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already registered. Please login.', 409);

    const hashedPassword = await bcrypt.hash(password, bcryptRounds);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'USER',
        name: name || email.split('@')[0],
      },
    });

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async refreshToken(token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) throw new AppError('Invalid token', 401);
      const payload = { userId: user.id, email: user.email, role: user.role };
      return { accessToken: generateAccessToken(payload) };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { smtpConfig: true },
    });
    if (!user) throw new AppError('User not found', 404);
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async saveSmtpConfig(userId, config) {
    return prisma.smtpConfig.upsert({
      where: { userId },
      update: {
        host: config.host,
        port: parseInt(config.port, 10),
        secure: config.port === 465,
        userEmail: config.userEmail,
        password: config.password,
        fromName: config.fromName,
      },
      create: {
        userId,
        host: config.host,
        port: parseInt(config.port, 10),
        secure: config.port === 465,
        userEmail: config.userEmail,
        password: config.password,
        fromName: config.fromName,
      },
    });
  }
}

module.exports = new AuthService();
