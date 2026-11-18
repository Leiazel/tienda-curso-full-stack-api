import { Router } from 'express';
import * as promoCodeController from '../controllers/promoCodeController.js';
import { requireAdminIfProtected } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAdminIfProtected, promoCodeController.getPromoCodes);
router.post('/validate', promoCodeController.validatePromo);
router.post('/', requireAdminIfProtected, promoCodeController.createPromo);

export default router;
