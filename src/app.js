import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getDbPool } from './config/database.js';
import { getEnvConfig } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_IMAGES_DIR = path.resolve(__dirname, '../public/images');

/**
 * Creates and configures the Express application instance.
 */
export function createApp({ db } = {}) {
  const app = express();
  const { allowedOrigins } = getEnvConfig();

  app.locals.db = db || getDbPool();

  app.use(
    helmet({
      // Permite que el frontend en otro origen (ej: http://localhost:5173) cargue imágenes servidas por este backend.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Archivos estáticos de imágenes de productos (accesibles en /images/products/<archivo>)
  app.use('/images', express.static(PUBLIC_IMAGES_DIR, { maxAge: '7d' }));

  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'tienda-curso-full-stack-api',
      brand: 'L&D Streetwear & Footwear',
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
