import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getDbPool } from './config/database.js';
import { getEnvConfig } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';

/**
 * Creates and configures the Express application instance.
 */
export function createApp({ db } = {}) {
  const app = express();
  const { allowedOrigins } = getEnvConfig();

  app.locals.db = db || getDbPool();

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'tienda-curso-full-stack-api',
      brand: 'DICH® Streetwear & Footwear',
      status: 'running',
      health: '/api/health',
      api: '/api',
    });
  });

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp();
