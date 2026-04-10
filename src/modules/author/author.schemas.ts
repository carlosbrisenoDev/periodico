import { z } from 'zod';

export const createAuthorSchema = z.object({
  name: z.string().min(2),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional()
});

export const updateAuthorSchema = createAuthorSchema.partial();

export const authorIdSchema = z.object({
  id: z.string().min(1)
});

export const listAuthorArticlesQuerySchema = z.object({
  scope: z.enum(['public', 'all']).optional()
});
