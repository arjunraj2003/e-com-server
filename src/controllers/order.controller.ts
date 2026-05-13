import { Response, NextFunction } from 'express';
import * as OrderService from '../services/order.service';
import { AuthRequest } from '../middlewares/auth';

export const placeOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.placeOrder(
      req.user!.userId,
      req.body.shippingAddressId,
      req.body.couponCode,
      req.body.sessionId
    );
    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
};

export const listOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await OrderService.getUserOrders(req.user!.userId);
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};

export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.getOrderById(req.params.id, req.user!.userId);
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await OrderService.cancelOrder(req.params.id, req.user!.userId);
    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) { next(err); }
};
