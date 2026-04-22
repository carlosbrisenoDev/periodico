import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');
const socialPlatformInputSchema = z.enum(['facebook', 'twitter', 'x', 'instagram', 'linkedin', 'custom']);
const socialLabelSchema = z.string().trim().min(2).max(120);

export const createSocialSchema = z
  .object({
    authorId: objectIdSchema,
    platform: socialPlatformInputSchema.transform((value) => (value === 'x' ? 'twitter' : value)),
    url: z.string().url(),
    label: socialLabelSchema.optional()
  })
  .superRefine((data, ctx) => {
    if (data.platform === 'custom' && !data.label) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Label is required for custom social links',
        path: ['label']
      });
    }
  });

export const updateSocialSchema = z
  .object({
    authorId: objectIdSchema.optional(),
    platform: socialPlatformInputSchema.transform((value) => (value === 'x' ? 'twitter' : value)).optional(),
    url: z.string().url().optional(),
    label: socialLabelSchema.optional()
  })
  .superRefine((data, ctx) => {
    if (data.platform === 'custom' && !data.label) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Label is required for custom social links',
        path: ['label']
      });
    }
  });

export const socialIdSchema = z.object({
  id: z.string().min(1)
});

export const socialAuthorIdSchema = z.object({
  authorId: objectIdSchema
});

export const listSocialsQuerySchema = z.object({
  authorId: objectIdSchema.optional(),
  platform: socialPlatformInputSchema.optional()
});

