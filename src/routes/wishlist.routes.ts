import { Router } from 'express';
import * as WishlistController from '../controllers/wishlist.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { addToWishlistSchema } from '../validations/wishlist.schema';

const router = Router();

router.get('/', authenticate, WishlistController.getWishlist);
router.post('/', authenticate, validate(addToWishlistSchema), WishlistController.addToWishlist);
router.delete('/:id', authenticate, WishlistController.removeFromWishlist);
router.post('/:id/move-to-cart', authenticate, WishlistController.moveToCart);

export default router;
