import { z } from 'zod';

export const createPollSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  allowMultiple: z.boolean().optional(),
  allowOther: z.boolean().optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1),
        imageUrl: z.string().optional(),
        votes: z.number().int().optional()
      })
    )
    .optional()
});

export const updatePollSchema = createPollSchema.partial();

export const pollIdSchema = z.object({
  id: z.string().min(1)
});

export const votePollSchema = z.object({
  optionIds: z.array(z.string()).optional(),
  otherText: z.string().trim().optional()
});
