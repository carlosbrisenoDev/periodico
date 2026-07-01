import { z } from 'zod';
export const createCategorySchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).optional(),
    description: z.string().max(300).optional(),
    order: z.number().int().optional(),
    color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).optional(),
    template: z.enum(['default', 'hero-grid', 'magazine', 'list']).optional()
});
export const updateCategorySchema = createCategorySchema.partial();
export const categoryIdSchema = z.object({
    id: z.string().min(1)
});
export const categorySlugSchema = z.object({
    slug: z.string().min(1)
});
