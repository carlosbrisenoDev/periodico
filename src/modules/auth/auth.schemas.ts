import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  role: z.enum(['admin', 'editor']).default('editor')
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8)
  })
  .refine(({ currentPassword, newPassword }) => currentPassword !== newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword']
  });

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().email().toLowerCase().optional()
  })
  .refine((payload) => payload.name !== undefined || payload.email !== undefined, {
    message: 'At least one field is required'
  });

export const userIdParamsSchema = z.object({
  id: z.string().min(1)
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'editor'])
});

export const updateUserActiveSchema = z.object({
  active: z.boolean()
});
