import { Router } from 'express';
import * as contactController from '../controllers/contactController.js';
import { requireAdminIfProtected } from '../middlewares/auth.js';

const router = Router();

router.post('/', contactController.createContact);
router.get('/', requireAdminIfProtected, contactController.getContacts);
router.patch('/:id/status', requireAdminIfProtected, contactController.updateContactStatus);

export default router;
