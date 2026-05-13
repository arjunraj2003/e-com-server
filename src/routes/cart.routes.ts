import { Router } from 'express';
import * as CartController from '../controllers/cart.controller';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { addToCartSchema, updateCartItemSchema } from '../validations/user.schema';

const router = Router();

router.get('/', optionalAuth, CartController.getCart);
router.post('/items', optionalAuth, validate(addToCartSchema), CartController.addItem);
router.put('/items/:itemId', optionalAuth, validate(updateCartItemSchema), CartController.updateItem);
router.delete('/items/:itemId', optionalAuth, CartController.removeItem);
router.post('/merge', authenticate, CartController.mergeCart);

export default router;
