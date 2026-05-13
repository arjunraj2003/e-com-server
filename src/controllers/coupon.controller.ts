import { Request, Response, NextFunction } from 'express';
import * as CouponService from '../services/coupon.service';
import { AuthRequest } from '../middlewares/auth';

export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, orderAmount } = req.body;
    const result = await CouponService.validateCoupon(code, orderAmount);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const listCoupons = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await CouponService.listCoupons();
    res.json({ success: true, data: coupons });
  } catch (err) { next(err); }
};

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await CouponService.createCoupon(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (err) { next(err); }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await CouponService.updateCoupon(req.params.id, req.body);
    res.json({ success: true, data: coupon });
  } catch (err) { next(err); }
};

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CouponService.deleteCoupon(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { next(err); }
};
