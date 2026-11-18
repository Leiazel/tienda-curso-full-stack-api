/**
 * Configuración centralizada de la aplicación desde variables de entorno.
 */
export function getEnvConfig() {
  const rawPort = process.env.PORT || '3000';
  const port = Number(rawPort);

  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const allowedOrigins =
    corsOrigin === '*'
      ? '*'
      : corsOrigin
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean);

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port,
    rawPort,
    corsOrigin,
    allowedOrigins,
    db: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME || 'dich_store_db',
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || '10'),
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dich_dev_secret_change_in_production',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    protectAdminRoutes:
      String(process.env.PROTECT_ADMIN_ROUTES || 'false').toLowerCase() === 'true',
  };
}

export default getEnvConfig;
