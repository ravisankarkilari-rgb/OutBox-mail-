const { sendError } = require('../utils/response');

/**
 * Global error handler — catches any error thrown or passed via next(err).
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return sendError(res, `Duplicate value for field: ${err.meta?.target?.join(', ')}`, 409);
  }
  // Prisma record not found
  if (err.code === 'P2025') {
    return sendError(res, 'Record not found', 404);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return sendError(res, message, statusCode);
};

const notFound = (req, res) => {
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
};

module.exports = { errorHandler, notFound };

