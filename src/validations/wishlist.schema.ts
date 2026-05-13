import { z } from 'zod';

export const addToWishlistSchema = z.object({
  body: z.object({
    variantId: z.string().uuid(),
  }),
});
