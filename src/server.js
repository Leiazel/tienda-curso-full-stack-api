import 'dotenv/config';
import app from './app.js';

const rawPort = process.env.PORT || '3000';
const port = Number(rawPort);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error(`Invalid PORT environment variable: "${rawPort}"`);
  process.exit(1);
}

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

function shutdown(signal) {
  console.log(`Received ${signal}. Closing HTTP server...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
