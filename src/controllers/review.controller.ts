import { Request, Response, NextFunction } from 'express';
import * as ReviewService from '../services/review.service';
import { AuthRequest } from '../middlewares/auth';

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await ReviewService.getProductReviews(req.params.productId);
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
};

export const submitReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const review = await ReviewService.createReview(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
};

export const approveReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ReviewService.approveReview(req.params.id, req.body.approved);
    res.json({ success: true, message: 'Review updated' });
  } catch (err) { next(err); }
};
