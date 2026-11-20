import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { optionalAuth, requireAdminIfProtected, requireAuth } from '../middlewares/auth.js';

const router = Router();

router.post('/', optionalAuth, orderController.createOrder);
router.get('/my-orders', requireAuth, orderController.getMyOrders);
router.get('/', requireAdminIfProtected, orderController.getOrders);
router.get('/:idOrNumber', orderController.getOrder);
router.patch('/:id/status', requireAdminIfProtected, orderController.updateOrderStatus);

export default router;
