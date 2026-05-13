import { Response, NextFunction } from 'express';
import * as CartService from '../services/cart.service';
import { AuthRequest } from '../middlewares/auth';

export const getCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cart = await CartService.getCart(req.user?.userId, req.query.sessionId as string);
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

export const addItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { variantId, quantity, sessionId } = req.body;
    const cart = await CartService.addToCart(variantId, quantity, req.user?.userId, sessionId);
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

export const updateItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cart = await CartService.getCart(req.user?.userId, req.query.sessionId as string);
    await CartService.updateCartItem(req.params.itemId, req.body.quantity, cart.id);
    res.json({ success: true, message: 'Cart updated' });
  } catch (err) { next(err); }
};

export const removeItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cart = await CartService.getCart(req.user?.userId, req.query.sessionId as string);
    await CartService.removeFromCart(req.params.itemId, cart.id);
    res.json({ success: true, message: 'Item removed' });
  } catch (err) { next(err); }
};

export const mergeCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await CartService.mergeCarts(req.user!.userId, req.body.sessionId);
    res.json({ success: true, message: 'Cart merged' });
  } catch (err) { next(err); }
};
