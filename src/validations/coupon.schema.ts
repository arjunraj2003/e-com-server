import { z } from 'zod';

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    minOrderAmount: z.number().nonnegative().optional().default(0),
    maxDiscountAmount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    expiresAt: z.coerce.date().optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: z.number().positive().optional(),
    minOrderAmount: z.number().nonnegative().optional(),
    maxDiscountAmount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    expiresAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    orderAmount: z.number().positive(),
  }),
});
