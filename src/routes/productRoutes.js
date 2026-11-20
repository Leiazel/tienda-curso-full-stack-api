import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { requireAdminIfProtected } from '../middlewares/auth.js';

const router = Router();

router.get('/', productController.getProducts);
router.get('/:idOrSlug', productController.getProduct);
router.post('/', requireAdminIfProtected, productController.createProduct);
router.put('/:id', requireAdminIfProtected, productController.updateProduct);
router.delete('/:id', requireAdminIfProtected, productController.deleteProduct);
router.post('/:id/variants', requireAdminIfProtected, productController.addVariant);
router.patch(
  '/:id/variants/:variantId/stock',
  requireAdminIfProtected,
  productController.updateVariantStock
);

export default router;
