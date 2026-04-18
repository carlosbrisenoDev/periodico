import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().trim().min(1),
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'subscriber']).optional()
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

export const updateMeSchema = z
  .object({
    username: z.string().trim().min(1).optional(),
    email: z.email().optional()
  })
  .refine((payload) => payload.username !== undefined || payload.email !== undefined, {
    message: 'At least one field is required'
  });

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'subscriber'])
});

export const updateUserActiveSchema = z.object({
  active: z.boolean()
});

export const userIdParamsSchema = z.object({
  id: z.string().min(1)
});
