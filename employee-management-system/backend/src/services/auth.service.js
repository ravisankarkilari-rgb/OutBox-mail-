const bcrypt = require('bcryptjs');
const https = require('https');
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

  // Google OAuth verification and user synchronization
  async googleAuth(credential, demoUser = null) {
    let email = null;
    let name = null;

    if (!credential && (!demoUser || !demoUser.email)) {
      throw new AppError('Google credential or email is required', 400);
    }

    if (demoUser && demoUser.email) {
      // Demo / simulated Google login when client ID is in sandbox
      email = demoUser.email;
      name = demoUser.name || email.split('@')[0];
    } else {
      // Verify Google ID token with Google's official tokeninfo endpoint
      const payload = await this.verifyGoogleToken(credential);
      email = payload.email;
      name = payload.name;
    }

    if (!email) {
      throw new AppError('Google account does not provide a valid email', 400);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      include: { smtpConfig: true },
    });

    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: randomPassword,
          role: 'USER',
        },
        include: { smtpConfig: true },
      });
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const { password: _, ...safeUser } = user;

    return { user: safeUser, accessToken, refreshToken };
  }

  verifyGoogleToken(idToken) {
    return new Promise((resolve, reject) => {
      https
        .get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const payload = JSON.parse(data);
              if (payload.error_description || payload.error) {
                return reject(new AppError(payload.error_description || 'Invalid Google token', 401));
              }
              resolve(payload);
            } catch (err) {
              reject(new AppError('Failed to parse Google response', 500));
            }
          });
        })
        .on('error', (err) => {
          reject(new AppError(`Google verification network error: ${err.message}`, 500));
        });
    });
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
