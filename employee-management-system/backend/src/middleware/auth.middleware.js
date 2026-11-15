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

    let user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { smtpConfig: true },
    });

    if (!user && decoded.email) {
      // On serverless ephemeral instances where /tmp/dev.db is fresh, restore the user session from the verified JWT
      try {
        user = await prisma.user.upsert({
          where: { email: decoded.email },
          update: { role: decoded.role || 'USER' },
          create: {
            id: decoded.userId,
            email: decoded.email,
            password: 'ephemeral-session-hash',
            role: decoded.role || 'USER',
            name: decoded.email.split('@')[0],
          },
          include: { smtpConfig: true },
        });
      } catch (_) {
        try {
          user = await prisma.user.findFirst({ where: { email: decoded.email }, include: { smtpConfig: true } });
        } catch (_) {}
      }
    }

    if (!user) {
      user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'USER',
        name: decoded.email ? decoded.email.split('@')[0] : 'User',
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
