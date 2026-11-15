const { verifyAccessToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const { prisma } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return sendError(res, 'Invalid token payload', 401);
    }

    let user = null;
    if (decoded.userId) {
      try {
        user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { smtpConfig: true },
        });
      } catch (_) {}
    }

    if (!user && decoded.email) {
      try {
        user = await prisma.user.findUnique({
          where: { email: decoded.email },
          include: { smtpConfig: true },
        });
      } catch (_) {}
    }

    const googleTokenHeader = req.headers['x-google-access-token'] || req.body?.googleAccessToken;

    if (!user && decoded.email) {
      // On serverless ephemeral instances where /tmp/dev.db is fresh, restore the user session from the verified JWT
      try {
        user = await prisma.user.upsert({
          where: { email: decoded.email },
          update: {
            role: decoded.role || 'USER',
            googleAccessToken: googleTokenHeader || undefined,
          },
          create: {
            id: decoded.userId,
            email: decoded.email,
            password: 'ephemeral-session-hash',
            role: decoded.role || 'USER',
            name: decoded.email.split('@')[0],
            googleAccessToken: googleTokenHeader || null,
          },
          include: { smtpConfig: true },
        });
      } catch (_) {
        try {
          user = await prisma.user.findFirst({ where: { email: decoded.email }, include: { smtpConfig: true } });
        } catch (_) {}
      }
    }

    if (user && googleTokenHeader && user.googleAccessToken !== googleTokenHeader) {
      user.googleAccessToken = googleTokenHeader;
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { googleAccessToken: googleTokenHeader },
        });
      } catch (_) {}
    }

    if (!user) {
      user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'USER',
        name: decoded.email ? decoded.email.split('@')[0] : 'User',
        googleAccessToken: googleTokenHeader || null,
      };
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired', 401);
    }
    return sendError(res, 'Authentication failed', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden: insufficient permissions', 403);
    }
    next();
  };
};

module.exports = { authenticate, authorize };
