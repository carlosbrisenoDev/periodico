import { z } from 'zod';

const statusSchema = z.enum(['draft', 'published', 'scheduled']);
const featuredTypeSchema = z.enum(['none', 'hero', 'headline', 'category_hero', 'breaking']);

const tagsSchema = z
  .array(z.string().trim().min(1))
  .default([])
  .transform((values) => Array.from(new Set(values.map((tag) => tag.trim()))));

export const createArticleSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).optional(),
  excerpt: z.string().min(3),
  content: z.string().min(10),
  featuredImageUrl: z.string().min(1).nullable().optional(),
  tags: tagsSchema.optional(),
  status: statusSchema.default('draft'),
  isFeatured: z.boolean().default(false),
  featuredType: featuredTypeSchema.default('none'),
  authorId: z.string().min(1),
  categoryIds: z.array(z.string().min(1)).default([]),
  scheduledAt: z.string().datetime().nullable().optional()
});

export const updateArticleSchema = createArticleSchema.partial();

export const articleIdSchema = z.object({
  id: z.string().min(1)
});

export const articleSlugSchema = z.object({
  slug: z.string().trim().min(1)
});

export const listArticlesQuerySchema = z.object({
  status: statusSchema.optional(),
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export const updateArticleFeatureSchema = z.object({
  isFeatured: z.boolean().optional(),
  featuredType: featuredTypeSchema.optional()
});

export const updateArticleStatusSchema = z
  .object({
    status: statusSchema,
    scheduledAt: z.string().datetime().nullable().optional()
  })
  .superRefine((value, ctx) => {
    if (value.status === 'scheduled' && !value.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduledAt'],
        message: 'scheduledAt is required when status is scheduled'
      });
    }
  });
