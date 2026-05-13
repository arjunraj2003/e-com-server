import { Router } from 'express';
import * as CouponController from '../controllers/coupon.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from '../validations/coupon.schema';

const router = Router();

// User — validate coupon
router.post('/validate', authenticate, validate(validateCouponSchema), CouponController.validateCoupon);

// Admin CRUD
router.get('/', authenticate, authorize('admin'), CouponController.listCoupons);
router.post('/', authenticate, authorize('admin'), validate(createCouponSchema), CouponController.createCoupon);
router.put('/:id', authenticate, authorize('admin'), validate(updateCouponSchema), CouponController.updateCoupon);
router.delete('/:id', authenticate, authorize('admin'), CouponController.deleteCoupon);

export default router;
