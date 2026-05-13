import { Router } from 'express';
import * as ReviewController from '../controllers/review.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createReviewSchema, approveReviewSchema } from '../validations/review.schema';

const router = Router();

router.get('/:productId', ReviewController.getReviews);
router.post('/', authenticate, validate(createReviewSchema), ReviewController.submitReview);
router.put('/:id/approve', authenticate, authorize('admin'), validate(approveReviewSchema), ReviewController.approveReview);

export default router;
