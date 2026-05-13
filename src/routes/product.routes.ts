import { Router } from 'express';
import * as ProductController from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createProductSchema, updateProductSchema,
  productQuerySchema, createVariantSchema,
} from '../validations/product.schema';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: '/tmp/uploads/' });

// Public routes
router.get('/', validate(productQuerySchema), ProductController.listProducts);
router.get('/:slug', ProductController.getProduct);
router.get('/id/:id', authenticate, authorize('admin'), ProductController.getProductById);

// Admin routes
router.post('/', authenticate, authorize('admin'), validate(createProductSchema), ProductController.createProduct);
router.put('/:id', authenticate, authorize('admin'), validate(updateProductSchema), ProductController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), ProductController.deleteProduct);

// Variant management
router.post('/:productId/variants', authenticate, authorize('admin'), validate(createVariantSchema), ProductController.createVariant);
router.put('/variants/:variantId', authenticate, authorize('admin'), ProductController.updateVariantStock);

// Image management
router.post('/:productId/images', authenticate, authorize('admin'), upload.array('images', 10), ProductController.uploadImages);
router.delete('/:productId/images/:imageId', authenticate, authorize('admin'), ProductController.deleteImage);

export default router;
