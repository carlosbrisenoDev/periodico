import { z } from 'zod';

export const isFavoriteParams = z.object({
  userId: z.string(),
  articleId: z.string(),
});