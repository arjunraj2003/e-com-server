import { AppDataSource } from '../config/data-source';
import { Refund, RefundStatus } from '../models/Refund';
import { Payment, PaymentStatus } from '../models/Payment';
import { Transaction } from '../models/Transaction';
import { Order, OrderStatus } from '../models/Order';
import { razorpay } from '../config/razorpay';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const refundRepo = () => AppDataSource.getRepository(Refund);
const transactionRepo = () => AppDataSource.getRepository(Transaction);
const orderRepo = () => AppDataSource.getRepository(Order);

export const requestRefund = async (
  userId: string,
  orderId: string,
  reason: string
) => {
  const order = await orderRepo().findOne({
    where: { id: orderId, userId },
    relations: ['payment'],
  });
  if (!order) throw new AppError('Order not found', 404);
  if (![OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status)) {
    throw new AppError('Refund can only be requested for delivered or cancelled orders', 400);
  }
  if (!order.payment || order.payment.status !== PaymentStatus.PAID) {
    throw new AppError('No completed payment found for this order', 400);
  }

  const existing = await refundRepo().findOneBy({ orderId });
  if (existing) throw new AppError('Refund already requested for this order', 409);

  const refund = refundRepo().create({
    orderId,
    paymentId: order.payment.id,
    amount: order.total,
    reason,
    status: RefundStatus.PENDING,
  });
  return refundRepo().save(refund);
};

export const processRefund = async (refundId: string) => {
  const refund = await refundRepo().findOne({
    where: { id: refundId },
    relations: ['payment'],
  });
  if (!refund) throw new AppError('Refund not found', 404);
  if (refund.status !== RefundStatus.PENDING) {
    throw new AppError(`Refund already ${refund.status}`, 400);
  }

  // gatewayPaymentId lives on Transaction, not Payment
  const transaction = await transactionRepo().findOne({
    where: { paymentId: refund.paymentId },
    order: { createdAt: 'DESC' },
  });
  if (!transaction?.gatewayPaymentId) {
    throw new AppError('No gateway payment ID found — payment may not have been captured yet', 400);
  }

  try {
    const rzRefund = await razorpay.payments.refund(transaction.gatewayPaymentId, {
      amount: Math.round(Number(refund.amount) * 100),
      notes: { reason: refund.reason || 'Customer request' },
    } as any);

    await refundRepo().update(refundId, {
      status: RefundStatus.PROCESSED,
      gatewayRefundId: (rzRefund as any).id,
    });

    await orderRepo().update(refund.orderId, { status: OrderStatus.RETURNED });

    return { message: 'Refund processed successfully', refundId: (rzRefund as any).id };
  } catch (err) {
    logger.error('Razorpay refund failed', err);
    throw new AppError('Refund processing failed', 500);
  }
};

export const listRefunds = async () => {
  return refundRepo().find({
    relations: ['order', 'payment'],
    order: { createdAt: 'DESC' },
  });
};

export const getRefundById = async (id: string) => {
  const refund = await refundRepo().findOne({
    where: { id },
    relations: ['order', 'payment'],
  });
  if (!refund) throw new AppError('Refund not found', 404);
  return refund;
};
