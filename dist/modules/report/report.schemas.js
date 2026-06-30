import { z } from 'zod';
export const createReportSchema = z.object({
    reportedArticleId: z.string().min(1),
    reason: z.string().min(5).max(500)
});
export const updateReportStatusSchema = z.object({
    status: z.enum(['pending', 'resolved', 'ignored'])
});
export const listReportsQuerySchema = z.object({
    status: z.enum(['pending', 'resolved', 'ignored']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
});
export const reportIdSchema = z.object({
    id: z.string().min(1)
});
