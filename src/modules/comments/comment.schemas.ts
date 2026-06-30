import { z } from 'zod';

export const createCommentSchema = z.object({
  articleId: z.string().min(1),
  authorName: z.string().trim().min(2),
  authorEmail: z.string().trim().email(),
  content: z.string().min(5).max(1000)
});

export const updateCommentStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected'])
});

export const listCommentsQuerySchema = z.object({
  articleId: z.string().min(1).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});
