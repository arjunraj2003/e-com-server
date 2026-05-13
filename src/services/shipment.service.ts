import { AppDataSource } from '../config/data-source';
import { Order, OrderStatus } from '../models/Order';
import { Shipment, ShipmentStatus } from '../models/Shipment';
import { AppError } from '../middlewares/errorHandler';

const orderRepo = () => AppDataSource.getRepository(Order);
const shipmentRepo = () => AppDataSource.getRepository(Shipment);

export const createShipment = async (
  orderId: string,
  data: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    estimatedDeliveryAt?: Date;
  }
) => {
  const order = await orderRepo().findOneBy({ id: orderId });
  if (!order) throw new AppError('Order not found', 404);
  if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED) {
    throw new AppError('Cannot ship a cancelled/returned order', 400);
  }

  const existing = await shipmentRepo().findOneBy({ orderId });
  if (existing) throw new AppError('Shipment already created for this order', 409);

  const shipment = shipmentRepo().create({ orderId, ...data, status: ShipmentStatus.PENDING });
  await shipmentRepo().save(shipment);

  // Update order status to SHIPPED
  await orderRepo().update(orderId, { status: OrderStatus.SHIPPED });

  return shipment;
};

export const updateTracking = async (
  shipmentId: string,
  data: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    status?: ShipmentStatus;
    estimatedDeliveryAt?: Date;
    deliveredAt?: Date;
  }
) => {
  const shipment = await shipmentRepo().findOneBy({ id: shipmentId });
  if (!shipment) throw new AppError('Shipment not found', 404);

  Object.assign(shipment, data);
  await shipmentRepo().save(shipment);

  // If delivered, update order status
  if (data.status === ShipmentStatus.DELIVERED) {
    await orderRepo().update(shipment.orderId, { status: OrderStatus.DELIVERED });
  }

  return shipment;
};

export const getShipmentByOrder = async (orderId: string) => {
  const shipment = await shipmentRepo().findOneBy({ orderId });
  if (!shipment) throw new AppError('Shipment not found', 404);
  return shipment;
};
