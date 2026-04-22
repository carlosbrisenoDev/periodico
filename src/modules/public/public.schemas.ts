import { z } from 'zod';

export const publicArticleSlugSchema = z.object({
  slug: z.string().min(1)
});

export const publicCategorySlugSchema = z.object({
  slug: z.string().min(1)
});

export const publicSearchSchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

export const publicRecommendationsSchema = z.object({
  tags: z.string().trim().optional(),
  excludeId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(12).default(4)
});


export const publicListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional()
});

export const publicArchiveSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  month: z.string().regex(/^(0?[1-9]|1[0-2])$/)
});
