import { Router } from 'express';

const router = Router();

/**
 * Health check endpoint to verify API availability.
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
