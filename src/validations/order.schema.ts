import { z } from 'zod';

export const placeOrderSchema = z.object({
  body: z.object({
    shippingAddressId: z.string().uuid(),
    couponCode: z.string().optional(),
    sessionId: z.string().optional(),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const returnRequestSchema = z.object({
  body: z.object({
    reason: z.string().min(10).max(500),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'pending', 'confirmed', 'processing', 'shipped',
      'delivered', 'cancelled', 'returned',
    ]),
  }),
  params: z.object({ id: z.string().uuid() }),
});
