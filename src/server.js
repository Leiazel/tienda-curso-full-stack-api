import 'dotenv/config';
import app from './app.js';
import { checkDatabaseHealth, closeDbPool } from './config/database.js';
import { getEnvConfig } from './config/env.js';

const { port, rawPort } = getEnvConfig();

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error(`Invalid PORT environment variable: "${rawPort}"`);
  process.exit(1);
}

const server = app.listen(port, async () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`API endpoints overview: http://localhost:${port}/api`);

  const dbStatus = await checkDatabaseHealth(app.locals.db);
  if (dbStatus.status === 'connected') {
    console.log(
      `MySQL connected (${dbStatus.database} at ${dbStatus.host}:${dbStatus.port})`
    );
  } else {
    console.warn(
      `Warning: MySQL not connected (${dbStatus.error}). Asegurate de tener MySQL corriendo y ejecutá "npm run db:setup".`
    );
  }
});

async function shutdown(signal) {
  console.log(`Received ${signal}. Closing HTTP server and MySQL pool...`);
  server.close(async () => {
    await closeDbPool();
    console.log('HTTP server and MySQL pool closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
