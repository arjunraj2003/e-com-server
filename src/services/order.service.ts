import { AppDataSource } from '../config/data-source';
import { Order, OrderStatus } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Cart } from '../models/Cart';
import { Inventory } from '../models/Inventory';
import { Coupon, DiscountType } from '../models/Coupon';
import { Payment, PaymentStatus } from '../models/Payment';
import { AppError } from '../middlewares/errorHandler';
import { sendOrderConfirmationEmail } from '../utils/emailTemplates';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import { cacheDel } from '../config/redis';

const orderRepo = () => AppDataSource.getRepository(Order);
const couponRepo = () => AppDataSource.getRepository(Coupon);
const inventoryRepo = () => AppDataSource.getRepository(Inventory);
const cartRepo = () => AppDataSource.getRepository(Cart);

const generateOrderNumber = () =>
  `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random()
    .toString(36)
    .toUpperCase()
    .slice(2, 8)}`;

export const placeOrder = async (
  userId: string,
  shippingAddressId: string,
  couponCode?: string,
  sessionId?: string
) => {
  return AppDataSource.transaction(async (manager) => {
    // Get cart
    const cart = await manager.findOne(Cart, {
      where: userId ? { userId } : { sessionId },
      relations: [
        'items', 'items.variant', 'items.variant.product',
        'items.variant.inventory',
      ],
    });
    if (!cart || !cart.items?.length) throw new AppError('Cart is empty', 400);

    let subtotal = 0;
    const orderItems: Partial<OrderItem>[] = [];

    // Validate stock and build order items
    for (const item of cart.items) {
      const inventory = item.variant.inventory;
      const available = inventory ? (Number(inventory.quantity) - Number(inventory.reservedQuantity)) : 0;
      
      if (!inventory || available < item.quantity) {
        throw new AppError(`Insufficient stock for ${item.variant.sku}. Available: ${available}, Required: ${item.quantity}`, 400);
      }
      const price = Number(item.variant.product?.basePrice || 0) + Number(item.variant.price || 0);
      subtotal += price * item.quantity;

      orderItems.push({
        variantId: item.variantId,
        productName: item.variant.product.name,
        variantAttributes: item.variant.attributes,
        price,
        quantity: item.quantity,
        subtotal: price * item.quantity,
      });

      // Deduct inventory
      await manager.decrement(Inventory, { id: inventory.id }, 'quantity', item.quantity);
      if (item.variant.product?.slug) {
        await cacheDel(`product:${item.variant.product.slug}`);
      }
    }

    // Coupon validation
    let discountAmount = 0;
    let couponId: string | undefined;
    if (couponCode) {
      const coupon = await couponRepo().findOneBy({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
          throw new AppError('Coupon expired', 400);
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw new AppError('Coupon usage limit reached', 400);
        }
        if (subtotal < Number(coupon.minOrderAmount)) {
          throw new AppError(`Minimum order amount ₹${coupon.minOrderAmount} required`, 400);
        }
        discountAmount =
          coupon.discountType === DiscountType.PERCENTAGE
            ? Math.min(
                (subtotal * Number(coupon.discountValue)) / 100,
                coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : Infinity
              )
            : Number(coupon.discountValue);
        couponId = coupon.id;
        await manager.increment(Coupon, { id: coupon.id }, 'usedCount', 1);
      }
    }

    const taxAmount = (subtotal - discountAmount) * 0.18; // 18% GST
    const shippingCharge = subtotal > 499 ? 0 : 49;
    const total = subtotal - discountAmount + taxAmount + shippingCharge;

    const order = manager.create(Order, {
      orderNumber: generateOrderNumber(),
      userId,
      shippingAddressId,
      couponId,
      items: orderItems as OrderItem[],
      subtotal,
      discountAmount,
      taxAmount,
      shippingCharge,
      total,
      status: OrderStatus.PENDING,
    });
    const savedOrder = await manager.save(Order, order);

    // Create pending payment record
    const payment = manager.create(Payment, {
      orderId: savedOrder.id,
      amount: total,
      status: PaymentStatus.PENDING,
    });
    await manager.save(Payment, payment);

    // Clear cart
    await manager.delete(Cart, cart.id);

    const user = await manager.findOneBy(User, { id: userId });
    if (user) {
      sendOrderConfirmationEmail(user.email, savedOrder.orderNumber, total).catch(() => {});
    }

    return savedOrder;
  });
};

export const getUserOrders = async (userId: string) => {
  return orderRepo().find({
    where: { userId },
    relations: ['items', 'payment', 'shipment'],
    order: { createdAt: 'DESC' },
  });
};

export const getOrderById = async (id: string, userId: string) => {
  const order = await orderRepo().findOne({
    where: { id, userId },
    relations: ['items', 'items.variant', 'items.variant.product', 'payment', 'shipment', 'shippingAddress'],
  });
  if (!order) throw new AppError('Order not found', 404);
  return order;
};

export const cancelOrder = async (id: string, userId: string) => {
  return AppDataSource.transaction(async (manager) => {
    const order = await manager.findOne(Order, {
      where: { id, userId },
      relations: ['items', 'items.variant', 'items.variant.product'],
    });

    if (!order) throw new AppError('Order not found', 404);
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new AppError('This order cannot be cancelled', 400);
    }

    // Restore inventory
    for (const item of order.items) {
      await manager.increment(
        Inventory,
        { variantId: item.variantId },
        'quantity',
        item.quantity
      );
      if (item.variant?.product?.slug) {
        await cacheDel(`product:${item.variant.product.slug}`);
      }
    }

    await manager.update(Order, id, { status: OrderStatus.CANCELLED });
  });
};
