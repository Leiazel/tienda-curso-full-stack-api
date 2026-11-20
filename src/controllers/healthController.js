import { checkDatabaseHealth } from '../config/database.js';

export async function getHealth(req, res) {
  const db = req.app.locals.db;
  const database = await checkDatabaseHealth(db);
  const strict = String(req.query.strict || '').toLowerCase() === 'true';

  const statusCode = strict && database.status !== 'connected' ? 503 : 200;

  res.status(statusCode).json({
    status: 'ok',
    service: 'tienda-curso-full-stack-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database,
  });
}
