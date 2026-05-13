import { z } from 'zod';

export const createShipmentSchema = z.object({
  body: z.object({
    carrier: z.string().min(1).max(100),
    trackingNumber: z.string().min(1).max(100),
    trackingUrl: z.string().url().optional(),
    estimatedDeliveryAt: z.coerce.date().optional(),
  }),
  params: z.object({ orderId: z.string().uuid() }),
});

export const updateShipmentSchema = z.object({
  body: z.object({
    carrier: z.string().min(1).max(100).optional(),
    trackingNumber: z.string().min(1).max(100).optional(),
    trackingUrl: z.string().url().optional(),
    status: z.enum(['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned']).optional(),
    estimatedDeliveryAt: z.coerce.date().optional(),
    deliveredAt: z.coerce.date().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
});
