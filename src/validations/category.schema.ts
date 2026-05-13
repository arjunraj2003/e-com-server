import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    imageUrl: z.string().url().optional(),
    parentId: z.string().uuid().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    imageUrl: z.string().url().optional(),
    parentId: z.string().uuid().nullable().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
});
