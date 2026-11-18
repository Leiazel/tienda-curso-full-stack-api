import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

/**
 * Creates and configures the Express application instance.
 */
export function createApp() {
  const app = express();

  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const allowedOrigins =
    corsOrigin === '*'
      ? '*'
      : corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'tienda-curso-full-stack-api',
      status: 'running',
      health: '/api/health',
    });
  });

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp();
