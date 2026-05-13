import { AppDataSource } from '../config/data-source';
import { Coupon, DiscountType } from '../models/Coupon';
import { AppError } from '../middlewares/errorHandler';

const couponRepo = () => AppDataSource.getRepository(Coupon);

export const listCoupons = async () => {
  return couponRepo().find({ order: { createdAt: 'DESC' } });
};

export const createCoupon = async (data: Partial<Coupon>) => {
  const coupon = couponRepo().create({
    ...data,
    code: (data.code as string).toUpperCase(),
  });
  return couponRepo().save(coupon);
};

export const updateCoupon = async (id: string, data: Partial<Coupon>) => {
  const coupon = await couponRepo().findOneBy({ id });
  if (!coupon) throw new AppError('Coupon not found', 404);
  if (data.code) data.code = (data.code as string).toUpperCase();
  await couponRepo().update(id, data);
  return couponRepo().findOneBy({ id });
};

export const deleteCoupon = async (id: string) => {
  const coupon = await couponRepo().findOneBy({ id });
  if (!coupon) throw new AppError('Coupon not found', 404);
  await couponRepo().delete(id);
};

export const validateCoupon = async (code: string, orderAmount: number) => {
  const coupon = await couponRepo().findOneBy({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw new AppError('Invalid coupon code', 404);
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new AppError('Coupon expired', 400);
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    throw new AppError('Coupon usage limit reached', 400);
  if (orderAmount < Number(coupon.minOrderAmount))
    throw new AppError(`Minimum order amount ₹${coupon.minOrderAmount} required`, 400);

  const discount =
    coupon.discountType === DiscountType.PERCENTAGE
      ? Math.min(
          (orderAmount * Number(coupon.discountValue)) / 100,
          coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : Infinity
        )
      : Number(coupon.discountValue);

  return { coupon, discount };
};
