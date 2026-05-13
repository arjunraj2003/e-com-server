import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { placeOrderSchema } from '../validations/order.schema';

const router = Router();

router.post('/', authenticate, validate(placeOrderSchema), OrderController.placeOrder);
router.get('/', authenticate, OrderController.listOrders);
router.get('/:id', authenticate, OrderController.getOrder);
router.put('/:id/cancel', authenticate, OrderController.cancelOrder);

export default router;
