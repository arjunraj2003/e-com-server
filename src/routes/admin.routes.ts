import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateOrderStatusSchema } from '../validations/order.schema';
import { approveReviewSchema } from '../validations/review.schema';
import { createShipmentSchema, updateShipmentSchema } from '../validations/shipment.schema';

const router = Router();

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// Dashboard analytics
router.get('/dashboard', AdminController.getDashboard);

// Order management
router.get('/orders', AdminController.getOrders);
router.put('/orders/:id/status', validate(updateOrderStatusSchema), AdminController.updateOrderStatus);

// Shipment management
router.post('/orders/:orderId/shipment', validate(createShipmentSchema), AdminController.createShipment);
router.put('/shipments/:id', validate(updateShipmentSchema), AdminController.updateTracking);

// User management
router.get('/users', AdminController.getUsers);
router.put('/users/:id/toggle', AdminController.toggleUser);

// Inventory alerts
router.get('/inventory/alerts', AdminController.getInventoryAlerts);

// Review moderation
router.get('/reviews/pending', AdminController.getPendingReviews);
router.put('/reviews/:id/approve', validate(approveReviewSchema), AdminController.approveAdminReview);

// Refund management
router.get('/refunds', AdminController.listRefunds);
router.post('/refunds/:id/process', AdminController.processRefund);

export default router;
