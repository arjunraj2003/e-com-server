import { AppDataSource } from '../config/data-source';
import { Order, OrderStatus } from '../models/Order';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Inventory } from '../models/Inventory';
import { AppError } from '../middlewares/errorHandler';

const orderRepo = () => AppDataSource.getRepository(Order);
const userRepo = () => AppDataSource.getRepository(User);
const productRepo = () => AppDataSource.getRepository(Product);
const inventoryRepo = () => AppDataSource.getRepository(Inventory);

export const getDashboard = async () => {
  const [totalOrders, totalUsers, totalProducts] = await Promise.all([
    orderRepo().count(),
    userRepo().count(),
    productRepo().count({ where: { isActive: true } }),
  ]);

  const revenue = await orderRepo()
    .createQueryBuilder('o')
    .select('SUM(o.total)', 'total')
    .where('o.status NOT IN (:...s)', { s: [OrderStatus.CANCELLED, OrderStatus.RETURNED] })
    .getRawOne();

  const recentOrders = await orderRepo().find({
    order: { createdAt: 'DESC' },
    take: 10,
    relations: ['user', 'payment'],
  });

  const monthlyRevenue = await orderRepo()
    .createQueryBuilder('o')
    .select("DATE_TRUNC('month', o.createdAt)", 'month')
    .addSelect('SUM(o.total)', 'revenue')
    .where("o.status NOT IN (:...s) AND o.createdAt >= NOW() - INTERVAL '6 months'", {
      s: [OrderStatus.CANCELLED, OrderStatus.RETURNED],
    })
    .groupBy("DATE_TRUNC('month', o.createdAt)")
    .orderBy('month', 'ASC')
    .getRawMany();

  return {
    stats: {
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue: parseFloat(revenue?.total || '0'),
    },
    recentOrders,
    monthlyRevenue,
  };
};

export const getOrders = async (page: number, limit = 20, status?: OrderStatus) => {
  const where: any = {};
  if (status) where.status = status;
  const [orders, total] = await orderRepo().findAndCount({
    where,
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
    relations: ['user', 'payment', 'shipment'],
  });
  return { orders, total, page, totalPages: Math.ceil(total / limit) };
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  const order = await orderRepo().findOneBy({ id });
  if (!order) throw new AppError('Order not found', 404);
  await orderRepo().update(id, { status });
};

export const getUsers = async (page: number, limit = 20) => {
  const [users, total] = await userRepo().findAndCount({
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });
  return { users, total, page, totalPages: Math.ceil(total / limit) };
};

export const toggleUserActive = async (id: string) => {
  const user = await userRepo().findOneBy({ id });
  if (!user) throw new AppError('User not found', 404);
  await userRepo().update(id, { isActive: !user.isActive });
  return { isActive: !user.isActive };
};

export const getInventoryAlerts = async (threshold = 5) => {
  return inventoryRepo()
    .createQueryBuilder('inv')
    .leftJoinAndSelect('inv.variant', 'variant')
    .leftJoinAndSelect('variant.product', 'product')
    .where('inv.quantity <= :threshold', { threshold })
    .orderBy('inv.quantity', 'ASC')
    .getMany();
};
