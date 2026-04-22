import { z } from 'zod';

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');

export const createFavoriteSchema = z.object({
  articleId: objectIdSchema
});

export const favoriteArticleParamsSchema = z.object({
  articleId: objectIdSchema
});