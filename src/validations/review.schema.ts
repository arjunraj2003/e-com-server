import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    title: z.string().max(100).optional(),
    comment: z.string().max(1000).optional(),
  }),
});

export const approveReviewSchema = z.object({
  body: z.object({
    approved: z.boolean(),
  }),
  params: z.object({ id: z.string().uuid() }),
});
