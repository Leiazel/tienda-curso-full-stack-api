/**
 * Middleware for unmatched routes (404 Not Found).
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

/**
 * Centralized Express error-handling middleware.
 */
export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (statusCode >= 500) {
    console.error('[API Error]', err);
  }

  res.status(statusCode).json({
    error: err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
    message:
      statusCode >= 500 && isProduction
        ? 'An unexpected internal error occurred'
        : err.message || 'An unexpected error occurred',
  });
}
