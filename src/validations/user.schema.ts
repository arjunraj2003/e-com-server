import { z } from 'zod';

export const addAddressSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
    addressLine1: z.string().min(5),
    addressLine2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().regex(/^\d{6}$/),
    country: z.string().optional().default('India'),
    isDefault: z.boolean().optional(),
    type: z.enum(['home', 'office', 'other']).optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(50).optional().or(z.literal('')),
    lastName: z.string().min(2).max(50).optional().or(z.literal('')),
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional().or(z.literal('')),
  }),
});

export const addToCartSchema = z.object({
  body: z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(100),
    sessionId: z.string().optional(),
  }),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().min(1).max(100),
  }),
  params: z.object({ itemId: z.string().uuid() }),
});

export const placeOrderSchema = z.object({
  body: z.object({
    shippingAddressId: z.string().uuid(),
    couponCode: z.string().optional(),
    sessionId: z.string().optional(),
  }),
});

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    title: z.string().max(100).optional(),
    comment: z.string().max(1000).optional(),
  }),
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    orderAmount: z.number().positive(),
  }),
});
