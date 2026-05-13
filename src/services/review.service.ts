import { AppDataSource } from '../config/data-source';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { AppError } from '../middlewares/errorHandler';

const reviewRepo = () => AppDataSource.getRepository(Review);
const productRepo = () => AppDataSource.getRepository(Product);

const recomputeRating = async (productId: string) => {
  const { avg, count } = await reviewRepo()
    .createQueryBuilder('r')
    .where('r.productId = :productId AND r.isApproved = true', { productId })
    .select('AVG(r.rating)', 'avg')
    .addSelect('COUNT(r.id)', 'count')
    .getRawOne();

  await productRepo().update(productId, {
    averageRating: parseFloat(avg) || 0,
    reviewCount: parseInt(count) || 0,
  });
};

export const getProductReviews = async (productId: string) => {
  return reviewRepo().find({
    where: { productId, isApproved: true },
    relations: ['user'],
    select: {
      id: true,
      rating: true,
      title: true,
      comment: true,
      isVerifiedPurchase: true,
      createdAt: true,
      user: { id: true, firstName: true, lastName: true, avatar: true } as any,
    },
    order: { createdAt: 'DESC' },
  });
};

export const createReview = async (
  userId: string,
  data: { productId: string; rating: number; title?: string; comment?: string }
) => {
  const existing = await reviewRepo().findOneBy({ productId: data.productId, userId });
  if (existing) throw new AppError('You already reviewed this product', 409);

  const hasOrdered = await AppDataSource.getRepository(Order)
    .createQueryBuilder('order')
    .innerJoin('order.items', 'item')
    .innerJoin('item.variant', 'variant')
    .where('order.userId = :userId AND variant.productId = :productId', {
      userId,
      productId: data.productId,
    })
    .getOne();

  const review = reviewRepo().create({
    ...data,
    userId,
    isVerifiedPurchase: !!hasOrdered,
    isApproved: false,
  });
  await reviewRepo().save(review);
  return review;
};

export const approveReview = async (id: string, approved: boolean) => {
  const review = await reviewRepo().findOneBy({ id });
  if (!review) throw new AppError('Review not found', 404);
  await reviewRepo().update(id, { isApproved: approved });
  await recomputeRating(review.productId);
};

export const getPendingReviews = async () => {
  return reviewRepo().find({
    where: { isApproved: false },
    relations: ['user', 'product'],
    order: { createdAt: 'DESC' },
  });
};
