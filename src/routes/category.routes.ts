import { Router } from 'express';
import * as CategoryController from '../controllers/category.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from '../validations/category.schema';

const router = Router();

// Public
router.get('/', CategoryController.listCategories);
router.get('/:slug', CategoryController.getCategory);

// Admin
router.post('/', authenticate, authorize('admin'), validate(createCategorySchema), CategoryController.createCategory);
router.put('/:id', authenticate, authorize('admin'), validate(updateCategorySchema), CategoryController.updateCategory);
router.delete('/:id', authenticate, authorize('admin'), CategoryController.deleteCategory);

export default router;
