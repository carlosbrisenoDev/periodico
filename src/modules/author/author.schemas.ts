import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

export const createAuthorSchema = z.object({
  name: z.string().min(2),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  userId: objectIdSchema.optional().nullable()
});

export const updateAuthorSchema = createAuthorSchema.partial();

export const authorIdSchema = z.object({
  id: z.string().min(1)
});

export const listAuthorArticlesQuerySchema = z.object({
  scope: z.enum(['public', 'all']).optional()
});
