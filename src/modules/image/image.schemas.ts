import { z } from 'zod';

export const imageIdSchema = z.object({
  id: z.string().min(1)
});

export const listImagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
