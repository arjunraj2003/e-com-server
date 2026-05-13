import { Response, NextFunction } from 'express';
import * as WishlistService from '../services/wishlist.service';
import { AuthRequest } from '../middlewares/auth';

export const getWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await WishlistService.getWishlist(req.user!.userId);
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

export const addToWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await WishlistService.addToWishlist(req.user!.userId, req.body.variantId);
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await WishlistService.removeFromWishlist(req.user!.userId, req.params.id);
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) { next(err); }
};

export const moveToCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await WishlistService.moveToCart(req.user!.userId, req.params.id);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};
