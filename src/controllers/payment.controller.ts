import express, { Response, NextFunction, Request } from 'express';
import * as PaymentService from '../services/payment.service';
import { AuthRequest } from '../middlewares/auth';

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await PaymentService.createRazorpayOrder(req.body.orderId, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await PaymentService.verifyPayment(req.body);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    await PaymentService.handleWebhook((req.body as Buffer).toString(), signature);
    res.json({ received: true });
  } catch (err) { next(err); }
};
