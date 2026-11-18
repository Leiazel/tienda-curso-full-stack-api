import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import contactRoutes from './contactRoutes.js';
import newsletterRoutes from './newsletterRoutes.js';
import orderRoutes from './orderRoutes.js';
import productRoutes from './productRoutes.js';
import promoCodeRoutes from './promoCodeRoutes.js';

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    name: 'tienda-curso-full-stack-api',
    brand: 'DICH® Streetwear & Footwear',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      auth: '/api/auth (POST /register, POST /login, GET /me)',
      categories: '/api/categories (GET, POST, PUT /:id, DELETE /:id)',
      products:
        '/api/products (GET ?category=&type=&size=&search=&featured=, POST, PUT /:id, DELETE /:id, PATCH /:id/variants/:variantId/stock)',
      promoCodes: '/api/promo-codes (GET, POST /validate, POST)',
      orders: '/api/orders (POST checkout, GET, GET /my-orders, GET /:idOrNumber, PATCH /:id/status)',
      newsletter: '/api/newsletter (POST /subscribe, GET, DELETE /:email)',
      contacts: '/api/contacts (POST, GET, PATCH /:id/status)',
    },
  });
});

router.get('/health', getHealth);

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/promo-codes', promoCodeRoutes);
router.use('/orders', orderRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/contacts', contactRoutes);

export default router;
