import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200),
    description: z.string().min(10),
    basePrice: z.number().positive(),
    categoryId: z.string().uuid(),
    brand: z.string().optional(),
    isFeatured: z.boolean().optional(),
    specifications: z.record(z.string()).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().min(10).optional(),
    basePrice: z.number().positive().optional(),
    categoryId: z.string().uuid().optional(),
    brand: z.string().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    specifications: z.record(z.string()).optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    category: z.string().optional(),
    search: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    brand: z.string().optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'rating']).optional(),
    featured: z.string().optional(),
  }),
});

export const createVariantSchema = z.object({
  body: z.object({
    sku: z.string().min(1),
    attributes: z.record(z.string()),
    price: z.number().positive().optional(),
    quantity: z.number().int().min(0).default(0),
    imageUrl: z.string().url().optional(),
  }),
  params: z.object({ productId: z.string().uuid() }),
});
