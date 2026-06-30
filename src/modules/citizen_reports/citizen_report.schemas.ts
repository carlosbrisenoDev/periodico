import { z } from 'zod';

export const createCitizenReportSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  subject: z.string().trim().min(2),
  description: z.string().min(10).max(5000),
  imageUrl: z.string().trim().optional()
});

export const updateCitizenReportStatusSchema = z.object({
  status: z.enum(['new', 'reviewed', 'resolved'])
});

export const listCitizenReportsQuerySchema = z.object({
  status: z.enum(['new', 'reviewed', 'resolved']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});
