import express, { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createPaymentOrderSchema, verifyPaymentSchema } from '../validations/payment.schema';

const router = Router();

router.post('/create-order', authenticate, validate(createPaymentOrderSchema), PaymentController.createOrder);
router.post('/verify', authenticate, validate(verifyPaymentSchema), PaymentController.verifyPayment);

// Webhook — raw body required for signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
);

export default router;
