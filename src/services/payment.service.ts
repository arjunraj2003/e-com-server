import crypto from 'crypto';
import { AppDataSource } from '../config/data-source';
import { Payment, PaymentStatus } from '../models/Payment';
import { Transaction } from '../models/Transaction';
import { Order, OrderStatus } from '../models/Order';
import { razorpay } from '../config/razorpay';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const paymentRepo = () => AppDataSource.getRepository(Payment);
const transactionRepo = () => AppDataSource.getRepository(Transaction);
const orderRepo = () => AppDataSource.getRepository(Order);

export const createRazorpayOrder = async (orderId: string, userId: string) => {
  const order = await orderRepo().findOne({
    where: { id: orderId, userId },
    relations: ['payment'],
  });
  if (!order) throw new AppError('Order not found', 404);
  if (!order.payment) throw new AppError('Payment record not found', 404);

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(Number(order.total) * 100), // paise
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order.id },
  });

  await paymentRepo().update(order.payment.id, {
    gatewayOrderId: razorpayOrder.id,
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};

export const verifyPayment = async (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  orderId: string;
}) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = data;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new AppError('Payment verification failed', 400);
  }

  return AppDataSource.transaction(async (manager) => {
    const payment = await manager.findOne(Payment, {
      where: { gatewayOrderId: razorpayOrderId },
    });
    if (!payment) throw new AppError('Payment not found', 404);

    await manager.update(Payment, payment.id, { status: PaymentStatus.PAID });
    await manager.update(Order, orderId, { status: OrderStatus.CONFIRMED });

    const txn = manager.create(Transaction, {
      paymentId: payment.id,
      gatewayPaymentId: razorpayPaymentId,
      gatewaySignature: razorpaySignature,
      rawResponse: { razorpayOrderId, razorpayPaymentId, razorpaySignature },
    });
    await manager.save(Transaction, txn);

    return { message: 'Payment verified successfully' };
  });
};

export const handleWebhook = async (body: string, signature: string) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    logger.warn('Invalid webhook signature');
    throw new AppError('Invalid webhook signature', 400);
  }

  const event = JSON.parse(body);
  logger.info('Razorpay webhook:', { event: event.event });

  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id) {
      const p = await paymentRepo().findOneBy({ gatewayOrderId: payment.order_id });
      if (p && p.status === PaymentStatus.PENDING) {
        await paymentRepo().update(p.id, { status: PaymentStatus.PAID });
        await orderRepo().update(
          { payment: { id: p.id } } as any,
          { status: OrderStatus.CONFIRMED }
        );
      }
    }
  }

  if (event.event === 'payment.failed') {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id) {
      const p = await paymentRepo().findOneBy({ gatewayOrderId: payment.order_id });
      if (p) await paymentRepo().update(p.id, { status: PaymentStatus.FAILED });
    }
  }
};
