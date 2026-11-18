/**
 * Middleware for unmatched routes (404 Not Found).
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

function mapDatabaseError(err) {
  if (!err || !err.code) return null;

  switch (err.code) {
    case 'ER_DUP_ENTRY':
      return {
        statusCode: 409,
        code: 'DUPLICATE_ENTRY',
        message: 'Ya existe un registro con ese identificador único (email, slug o SKU)',
      };
    case 'ER_NO_REFERENCED_ROW_2':
    case 'ER_NO_REFERENCED_ROW':
      return {
        statusCode: 400,
        code: 'INVALID_REFERENCE',
        message: 'La referencia indicada (categoría, producto o variante) no existe',
      };
    case 'ER_ROW_IS_REFERENCED_2':
    case 'ER_ROW_IS_REFERENCED':
      return {
        statusCode: 409,
        code: 'RESOURCE_IN_USE',
        message: 'No se puede eliminar el recurso porque tiene registros asociados',
      };
    case 'ECONNREFUSED':
    case 'ENOTFOUND':
    case 'ETIMEDOUT':
    case 'ER_ACCESS_DENIED_ERROR':
    case 'ER_BAD_DB_ERROR':
      return {
        statusCode: 503,
        code: 'DATABASE_UNAVAILABLE',
        message:
          'No se pudo conectar con la base de datos MySQL. Verificá que el servidor MySQL esté activo y ejecutá "npm run db:setup".',
      };
    default:
      return null;
  }
}

/**
 * Centralized Express error-handling middleware.
 */
export function errorHandler(err, _req, res, _next) {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'INVALID_JSON',
      message: 'El cuerpo de la petición no contiene JSON válido',
    });
  }

  const mappedDbError = mapDatabaseError(err);
  const statusCode = mappedDbError?.statusCode || err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (statusCode >= 500) {
    console.error('[API Error]', err);
  }

  const payload = {
    error:
      mappedDbError?.code ||
      err.code ||
      (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
    message:
      mappedDbError?.message ||
      (statusCode >= 500 && isProduction
        ? 'An unexpected internal error occurred'
        : err.message || 'An unexpected error occurred'),
  };

  if (err.details) {
    payload.details = err.details;
  }

  return res.status(statusCode).json(payload);
}
