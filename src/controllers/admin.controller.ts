import { Request, Response, NextFunction } from 'express';
import * as AdminService from '../services/admin.service';
import * as ReviewService from '../services/review.service';
import * as ShipmentService from '../services/shipment.service';
import * as RefundService from '../services/refund.service';
import { OrderStatus } from '../models/Order';

export const getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await AdminService.getDashboard();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const status = req.query.status as OrderStatus | undefined;
    const data = await AdminService.getOrders(page, 20, status);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AdminService.updateOrderStatus(req.params.id, req.body.status);
    res.json({ success: true, message: 'Order status updated' });
  } catch (err) { next(err); }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const data = await AdminService.getUsers(page);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const toggleUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.toggleUserActive(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getInventoryAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 5;
    const data = await AdminService.getInventoryAlerts(threshold);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getPendingReviews = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await ReviewService.getPendingReviews();
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
};

export const approveAdminReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ReviewService.approveReview(req.params.id, req.body.approved);
    res.json({ success: true, message: 'Review updated' });
  } catch (err) { next(err); }
};

export const createShipment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shipment = await ShipmentService.createShipment(req.params.orderId, req.body);
    res.status(201).json({ success: true, data: shipment });
  } catch (err) { next(err); }
};

export const updateTracking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shipment = await ShipmentService.updateTracking(req.params.id, req.body);
    res.json({ success: true, data: shipment });
  } catch (err) { next(err); }
};

export const listRefunds = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const refunds = await RefundService.listRefunds();
    res.json({ success: true, data: refunds });
  } catch (err) { next(err); }
};

export const processRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await RefundService.processRefund(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
