import { Router } from 'express';
import * as newsletterController from '../controllers/newsletterController.js';
import { requireAdminIfProtected } from '../middlewares/auth.js';

const router = Router();

router.post('/subscribe', newsletterController.subscribe);
router.get('/', requireAdminIfProtected, newsletterController.getSubscribers);
router.delete('/:email', newsletterController.unsubscribe);

export default router;
