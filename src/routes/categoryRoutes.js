import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { requireAdminIfProtected } from '../middlewares/auth.js';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/:idOrSlug', categoryController.getCategory);
router.post('/', requireAdminIfProtected, categoryController.createCategory);
router.put('/:id', requireAdminIfProtected, categoryController.updateCategory);
router.delete('/:id', requireAdminIfProtected, categoryController.deleteCategory);

export default router;
