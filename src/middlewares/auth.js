import jwt from 'jsonwebtoken';
import { getEnvConfig } from '../config/env.js';
import { AppError } from './validate.js';

export function signAuthToken(user) {
  const { jwt: jwtConfig } = getEnvConfig();
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
}

function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(
      401,
      'INVALID_AUTH_HEADER',
      'Formato de autorización inválido. Usa: Authorization: Bearer <token>'
    );
  }
  return token;
}

function verifyToken(token) {
  const { jwt: jwtConfig } = getEnvConfig();
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Token inválido o expirado');
  }
}

export function requireAuth(req, _res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Se requiere autenticación mediante Bearer token');
  }
  req.user = verifyToken(token);
  next();
}

export function optionalAuth(req, _res, next) {
  const token = extractBearerToken(req);
  if (token) {
    req.user = verifyToken(token);
  }
  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError(403, 'FORBIDDEN', 'Se requieren permisos de administrador');
  }
  next();
}

/**
 * Protege rutas administrativas cuando PROTECT_ADMIN_ROUTES=true en .env.
 * Si está en false (modo curso/desarrollo), permite probar el CRUD sin fricción,
 * pero igualmente procesa el token si el cliente lo envía.
 */
export function requireAdminIfProtected(req, res, next) {
  const { protectAdminRoutes } = getEnvConfig();
  if (!protectAdminRoutes) {
    return optionalAuth(req, res, next);
  }
  requireAuth(req, res, () => {
    requireAdmin(req, res, next);
  });
}
